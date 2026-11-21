package com.example.viewmodel

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.core.NetworkConnectivityMonitor
import com.example.core.SessionPersistenceStore
import com.example.core.TokenRefreshOutcome
import com.example.core.refreshAuthTokenSafely
import com.example.core.signOutUser
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

private const val SESSION_VM_TAG = "AuthSessionVM"
private const val FOREGROUND_REFRESH_INTERVAL_MS = 15L * 60L * 1000L // 15 min
private const val PERIODIC_KEEPALIVE_INTERVAL_MS = 45L * 60L * 1000L // 45 min (well before 60-min ID token expiry)

sealed interface AuthSessionUiState {
    /** Cold start while FirebaseAuth restores its persisted refresh token / user from disk. */
    data object Restoring : AuthSessionUiState

    /** Verified active Firebase Authentication session (persisted across restarts & offline periods). */
    data class Authenticated(
        val userId: String,
        val displayName: String,
        val email: String,
        val photoUrl: String,
        val isOnline: Boolean,
        val isRefreshingSession: Boolean = false
    ) : AuthSessionUiState

    /** Confirmed unauthenticated state. `allowAutoSignIn` is false right after explicit user logout. */
    data class Unauthenticated(
        val allowAutoSignIn: Boolean
    ) : AuthSessionUiState
}

/**
 * Pure state-transition policy used by [AuthSessionViewModel] and verified directly in unit tests.
 */
object SessionDecisionPolicy {
    fun resolveSessionState(
        authInitialized: Boolean,
        userId: String?,
        displayName: String,
        email: String,
        photoUrl: String,
        isOnline: Boolean,
        explicitlyLoggedOut: Boolean,
        isRefreshingSession: Boolean = false
    ): AuthSessionUiState {
        if (!userId.isNullOrBlank()) {
            return AuthSessionUiState.Authenticated(
                userId = userId,
                displayName = displayName,
                email = email,
                photoUrl = photoUrl,
                isOnline = isOnline,
                isRefreshingSession = isRefreshingSession
            )
        }
        if (!authInitialized) {
            return AuthSessionUiState.Restoring
        }
        return AuthSessionUiState.Unauthenticated(allowAutoSignIn = !explicitlyLoggedOut)
    }

    fun shouldRefreshTokenOnForeground(
        lastRefreshMs: Long,
        nowMs: Long,
        wasOffline: Boolean,
        isOnline: Boolean
    ): Boolean {
        if (!isOnline) return false
        if (wasOffline) return true
        return (nowMs - lastRefreshMs) >= FOREGROUND_REFRESH_INTERVAL_MS
    }
}

/**
 * Activity-scoped single source of truth for Firebase Authentication session persistence.
 *
 * Fixes automatic logouts caused by:
 * 1. Recomposition recreating unmemoized `authStateFlow()` listeners.
 * 2. Cold-start login flash before Firebase Auth finishes restoring its disk-persisted session.
 * 3. Silent 60-minute ID token expiration during prolonged active use or after offline reconnection.
 * 4. Network disconnections interfering with auth state.
 */
class AuthSessionViewModel(
    appContext: Context,
    private val sessionStore: SessionPersistenceStore,
    private val auth: FirebaseAuth = Firebase.auth
) : ViewModel() {

    private val context = appContext.applicationContext

    private var authInitialized = auth.currentUser != null
    private var explicitlyLoggedOut = false
    private var isOnline = NetworkConnectivityMonitor.isCurrentlyOnline(context)
    private var wasOffline = !isOnline
    private var lastTokenRefreshMs = 0L

    private val _sessionState = MutableStateFlow<AuthSessionUiState>(
        buildState(auth.currentUser)
    )
    val sessionState: StateFlow<AuthSessionUiState> = _sessionState.asStateFlow()

    private val authStateListener = FirebaseAuth.AuthStateListener { firebaseAuth ->
        authInitialized = true
        val user = firebaseAuth.currentUser
        if (user != null) {
            explicitlyLoggedOut = false
            viewModelScope.launch {
                sessionStore.markSignedIn(user.uid)
            }
        }
        _sessionState.value = buildState(user)
    }

    private val idTokenListener = FirebaseAuth.IdTokenListener { firebaseAuth ->
        val user = firebaseAuth.currentUser
        if (user != null) {
            val now = System.currentTimeMillis()
            lastTokenRefreshMs = now
            viewModelScope.launch {
                sessionStore.recordTokenRefresh(now)
            }
            // Keep Authenticated state fresh with latest displayName/email/photoUrl without tearing down shell
            _sessionState.value = buildState(user)
        }
    }

    init {
        viewModelScope.launch {
            val meta = sessionStore.readMetadata()
            explicitlyLoggedOut = meta.explicitlyLoggedOut
            lastTokenRefreshMs = meta.lastTokenRefreshMs
            // Re-evaluate current state with persisted explicit-logout flag
            _sessionState.value = buildState(auth.currentUser)
        }

        // Register persistent FirebaseAuth listeners ONCE for the lifetime of this ViewModel
        auth.addAuthStateListener(authStateListener)
        auth.addIdTokenListener(idTokenListener)

        // Monitor network connectivity transitions (offline <-> online) without logging users out
        viewModelScope.launch {
            NetworkConnectivityMonitor.observeIsOnline(context).collect { onlineNow ->
                val cameBackOnline = !isOnline && onlineNow
                isOnline = onlineNow
                if (!onlineNow) {
                    wasOffline = true
                }
                _sessionState.value = buildState(auth.currentUser)

                if (cameBackOnline && auth.currentUser != null) {
                    Log.d(SESSION_VM_TAG, "Internet reconnected; silently verifying Firebase Auth token.")
                    verifyAndKeepSessionAlive(forceRefresh = false)
                }
            }
        }

        // Proactive 45-minute keep-alive so prolonged active sessions never hit stale 60-min ID tokens
        viewModelScope.launch {
            while (isActive) {
                delay(PERIODIC_KEEPALIVE_INTERVAL_MS)
                if (isOnline && auth.currentUser != null) {
                    verifyAndKeepSessionAlive(forceRefresh = false)
                }
            }
        }
    }

    private fun buildState(
        user: FirebaseUser?,
        isRefreshing: Boolean = false
    ): AuthSessionUiState {
        return SessionDecisionPolicy.resolveSessionState(
            authInitialized = authInitialized,
            userId = user?.uid,
            displayName = user?.displayName.orEmpty(),
            email = user?.email.orEmpty(),
            photoUrl = user?.photoUrl?.toString().orEmpty(),
            isOnline = isOnline,
            explicitlyLoggedOut = explicitlyLoggedOut,
            isRefreshingSession = isRefreshing
        )
    }

    /**
     * Called when MainActivity enters foreground (`ON_START`).
     * Quietly verifies/refreshes Firebase ID token when online and due, never logging out offline users.
     */
    fun onAppForegrounded() {
        val user = auth.currentUser ?: return
        val now = System.currentTimeMillis()
        isOnline = NetworkConnectivityMonitor.isCurrentlyOnline(context)
        if (!isOnline) {
            wasOffline = true
            _sessionState.value = buildState(user)
            return
        }
        if (SessionDecisionPolicy.shouldRefreshTokenOnForeground(lastTokenRefreshMs, now, wasOffline, isOnline)) {
            viewModelScope.launch {
                verifyAndKeepSessionAlive(forceRefresh = false)
            }
        } else {
            _sessionState.value = buildState(user)
        }
    }

    /**
     * Called immediately after interactive or silent Google Sign-In completes.
     */
    fun onSignInSuccess() {
        explicitlyLoggedOut = false
        authInitialized = true
        val user = auth.currentUser
        if (user != null) {
            val now = System.currentTimeMillis()
            lastTokenRefreshMs = now
            viewModelScope.launch {
                sessionStore.markSignedIn(user.uid, now)
            }
        }
        _sessionState.value = buildState(user)
    }

    /**
     * Triggered ONLY when the user explicitly confirms Logout in the UI.
     */
    fun signOutExplicitly(credentialManager: CredentialManager) {
        explicitlyLoggedOut = true
        signOutUser(
            credentialManager = credentialManager,
            scope = viewModelScope,
            sessionStore = sessionStore,
            onSignOutComplete = {
                authInitialized = true
                _sessionState.value = AuthSessionUiState.Unauthenticated(allowAutoSignIn = false)
            }
        )
    }

    private suspend fun verifyAndKeepSessionAlive(forceRefresh: Boolean) {
        val user = auth.currentUser ?: return
        _sessionState.value = buildState(user, isRefreshing = true)
        when (refreshAuthTokenSafely(user, forceRefresh = forceRefresh)) {
            TokenRefreshOutcome.VALID -> {
                val now = System.currentTimeMillis()
                lastTokenRefreshMs = now
                wasOffline = false
                sessionStore.recordTokenRefresh(now)
                _sessionState.value = buildState(auth.currentUser, isRefreshing = false)
            }
            TokenRefreshOutcome.TRANSIENT_NETWORK_ERROR -> {
                // Keep the authenticated session completely intact while offline/unstable
                _sessionState.value = buildState(auth.currentUser, isRefreshing = false)
            }
            TokenRefreshOutcome.SESSION_REVOKED -> {
                // Account was disabled or deleted on Firebase Console; sign out cleanly
                Log.w(SESSION_VM_TAG, "Account disabled/revoked by server; clearing local auth session.")
                auth.signOut()
                _sessionState.value = AuthSessionUiState.Unauthenticated(allowAutoSignIn = false)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        auth.removeAuthStateListener(authStateListener)
        auth.removeIdTokenListener(idTokenListener)
    }
}
