package com.example.core

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.util.Log
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.example.R
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.Companion.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
import com.google.firebase.Firebase
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.FirebaseTooManyRequestsException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.auth
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.IOException

private const val AUTH_TAG = "Auth"

enum class TokenRefreshOutcome {
    VALID,
    TRANSIENT_NETWORK_ERROR,
    SESSION_REVOKED
}

/**
 * Identifies fatal server-side account revocation/deletion errors.
 * Only these errors indicate the Firebase Auth session itself is permanently invalid.
 */
fun isRevokedOrDeletedAccountError(throwable: Throwable): Boolean {
    val invalidUser = generateSequence(throwable) { it.cause }
        .filterIsInstance<FirebaseAuthInvalidUserException>()
        .firstOrNull() ?: return false
    return invalidUser.errorCode in setOf(
        "ERROR_USER_DISABLED",
        "ERROR_USER_NOT_FOUND",
        "ERROR_USER_TOKEN_EXPIRED"
    )
}

/**
 * Identifies transient connectivity, timeout, or throttling errors during ID token refresh.
 * These MUST NEVER log out an authenticated user.
 */
fun isTransientAuthRefreshError(throwable: Throwable): Boolean {
    val chain = generateSequence(throwable) { it.cause }.toList()
    if (chain.any {
            it is FirebaseNetworkException ||
                it is FirebaseTooManyRequestsException ||
                it is IOException
        }
    ) {
        return true
    }
    val combinedMsg = chain.joinToString(" ") { it.message.orEmpty() }.lowercase()
    return combinedMsg.contains("network") ||
        combinedMsg.contains("timeout") ||
        combinedMsg.contains("timed out") ||
        combinedMsg.contains("unable to resolve host") ||
        combinedMsg.contains("unreachable") ||
        combinedMsg.contains("connection") ||
        combinedMsg.contains("offline")
}

/**
 * Refreshes the Firebase Auth ID token quietly without ever logging the user out
 * when offline or experiencing unstable mobile internet.
 */
suspend fun refreshAuthTokenSafely(
    user: FirebaseUser,
    forceRefresh: Boolean = false
): TokenRefreshOutcome {
    return try {
        user.getIdToken(forceRefresh).await()
        TokenRefreshOutcome.VALID
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        when {
            isRevokedOrDeletedAccountError(e) -> {
                Log.w(AUTH_TAG, "Firebase account session revoked/disabled: ${e.message}")
                TokenRefreshOutcome.SESSION_REVOKED
            }
            isTransientAuthRefreshError(e) -> {
                Log.d(AUTH_TAG, "Skipping token refresh while offline/reconnecting: ${e.message}")
                TokenRefreshOutcome.TRANSIENT_NETWORK_ERROR
            }
            else -> {
                // Keep session alive on unexpected non-revocation errors rather than forcing logout
                Log.w(AUTH_TAG, "Non-fatal token refresh warning (keeping session active): ${e.message}")
                TokenRefreshOutcome.TRANSIENT_NETWORK_ERROR
            }
        }
    }
}

fun FirebaseAuth.authStateFlow(): Flow<FirebaseUser?> = callbackFlow {
    val listener = FirebaseAuth.AuthStateListener { auth ->
        trySend(auth.currentUser)
    }
    addAuthStateListener(listener)
    awaitClose { removeAuthStateListener(listener) }
}

private tailrec fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}

fun attemptAutoSignIn(
    context: Context,
    credentialManager: CredentialManager,
    onAuthSuccess: () -> Unit,
    onUnauthenticated: () -> Unit,
    scope: CoroutineScope
) {
    if (Firebase.auth.currentUser != null) {
        onAuthSuccess()
        return
    }
    val clientId = try {
        context.getString(R.string.default_web_client_id)
    } catch (_: Exception) {
        onUnauthenticated()
        return
    }
    val googleIdOption = GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(true)
        .setServerClientId(clientId)
        .setAutoSelectEnabled(true)
        .build()
    val request = GetCredentialRequest.Builder()
        .addCredentialOption(googleIdOption)
        .build()

    scope.launch {
        try {
            val activityContext = context.findActivity() ?: context
            val cred = credentialManager.getCredential(activityContext, request).credential
            if (cred is CustomCredential && cred.type == TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val token = GoogleIdTokenCredential.createFrom(cred.data).idToken
                Firebase.auth.signInWithCredential(
                    GoogleAuthProvider.getCredential(token, null)
                ).await()
                onAuthSuccess()
            } else {
                onUnauthenticated()
            }
        } catch (_: Exception) {
            onUnauthenticated()
        }
    }
}

fun onGoogleSignInClicked(
    context: Context,
    credentialManager: CredentialManager,
    onAuthSuccess: () -> Unit,
    onAuthError: (String) -> Unit,
    scope: CoroutineScope,
    onAuthCancelled: () -> Unit = {}
) {
    val clientId = try {
        context.getString(R.string.default_web_client_id)
    } catch (_: Exception) {
        onAuthError("Google Sign-In configuration missing: default_web_client_id not found.")
        return
    }
    val activity = context.findActivity()
    if (activity == null) {
        onAuthError("Unable to launch Google Sign-In without an active Activity.")
        return
    }
    val signInOption = GetSignInWithGoogleOption.Builder(serverClientId = clientId).build()
    val request = GetCredentialRequest.Builder()
        .addCredentialOption(signInOption)
        .build()

    scope.launch {
        try {
            val cred = credentialManager.getCredential(activity, request).credential
            if (cred is CustomCredential && cred.type == TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val token = GoogleIdTokenCredential.createFrom(cred.data).idToken
                Firebase.auth.signInWithCredential(
                    GoogleAuthProvider.getCredential(token, null)
                ).await()
                onAuthSuccess()
            } else {
                onAuthError("Unexpected credential type received.")
            }
        } catch (e: GetCredentialCancellationException) {
            Log.w(AUTH_TAG, "Google Sign-In flow cancelled or dismissed: ${e.message}", e)
            onAuthCancelled()
        } catch (e: Exception) {
            Log.e(AUTH_TAG, "Google Sign-In failed", e)
            onAuthError(e.localizedMessage ?: "Google Sign-In failed. Please try again.")
        }
    }
}

fun signOutUser(
    credentialManager: CredentialManager,
    scope: CoroutineScope,
    sessionStore: SessionPersistenceStore? = null,
    onSignOutComplete: () -> Unit = {}
) {
    scope.launch {
        withContext(NonCancellable) {
            try {
                sessionStore?.markExplicitSignOut()
            } catch (e: Exception) {
                Log.w(AUTH_TAG, "Failed to persist explicit sign-out flag: ${e.message}")
            }
            try {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
            } catch (e: Exception) {
                Log.w(AUTH_TAG, "Failed to clear credential state: ${e.message}")
            } finally {
                Firebase.auth.signOut()
                onSignOutComplete()
            }
        }
    }
}
