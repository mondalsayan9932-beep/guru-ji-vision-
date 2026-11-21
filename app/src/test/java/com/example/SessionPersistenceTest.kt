package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.core.SessionPersistenceStore
import com.example.core.isRevokedOrDeletedAccountError
import com.example.core.isTransientAuthRefreshError
import com.example.data.model.UserProfile
import com.example.viewmodel.AuthSessionUiState
import com.example.viewmodel.SessionDecisionPolicy
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class SessionPersistenceTest {

    @Test
    fun `cold start stays in Restoring until FirebaseAuth delivers initial state`() {
        val restoring = SessionDecisionPolicy.resolveSessionState(
            authInitialized = false,
            userId = null,
            displayName = "",
            email = "",
            photoUrl = "",
            isOnline = true,
            explicitlyLoggedOut = false
        )
        assertTrue(restoring is AuthSessionUiState.Restoring)

        // Even while offline, an authenticated persisted FirebaseUser remains Authenticated
        val offlineAuthenticated = SessionDecisionPolicy.resolveSessionState(
            authInitialized = true,
            userId = "student_uid_101",
            displayName = "Sayan Mondal",
            email = "student@gurujivision.in",
            photoUrl = "",
            isOnline = false,
            explicitlyLoggedOut = false
        )
        assertTrue(offlineAuthenticated is AuthSessionUiState.Authenticated)
        val authState = offlineAuthenticated as AuthSessionUiState.Authenticated
        assertEquals("student_uid_101", authState.userId)
        assertFalse(authState.isOnline)
    }

    @Test
    fun `explicit logout prevents immediate auto sign-in while non-explicit unauthenticated allows it`() {
        val afterExplicitLogout = SessionDecisionPolicy.resolveSessionState(
            authInitialized = true,
            userId = null,
            displayName = "",
            email = "",
            photoUrl = "",
            isOnline = true,
            explicitlyLoggedOut = true
        )
        assertEquals(AuthSessionUiState.Unauthenticated(allowAutoSignIn = false), afterExplicitLogout)

        val freshLaunch = SessionDecisionPolicy.resolveSessionState(
            authInitialized = true,
            userId = null,
            displayName = "",
            email = "",
            photoUrl = "",
            isOnline = true,
            explicitlyLoggedOut = false
        )
        assertEquals(AuthSessionUiState.Unauthenticated(allowAutoSignIn = true), freshLaunch)
    }

    @Test
    fun `foreground token refresh runs after reconnect or interval and never while offline`() {
        val t0 = 1_700_000_000_000L
        // Offline must skip refresh and keep session intact
        assertFalse(
            SessionDecisionPolicy.shouldRefreshTokenOnForeground(
                lastRefreshMs = 0L,
                nowMs = t0,
                wasOffline = true,
                isOnline = false
            )
        )
        // Reconnecting from offline triggers immediate quiet token verification
        assertTrue(
            SessionDecisionPolicy.shouldRefreshTokenOnForeground(
                lastRefreshMs = t0 - 60_000L,
                nowMs = t0,
                wasOffline = true,
                isOnline = true
            )
        )
        // Within 15 minutes while continuously online: no redundant refresh needed
        assertFalse(
            SessionDecisionPolicy.shouldRefreshTokenOnForeground(
                lastRefreshMs = t0 - (5L * 60L * 1000L),
                nowMs = t0,
                wasOffline = false,
                isOnline = true
            )
        )
        // After 20 minutes online: refresh token proactively before 60-minute expiry
        assertTrue(
            SessionDecisionPolicy.shouldRefreshTokenOnForeground(
                lastRefreshMs = t0 - (20L * 60L * 1000L),
                nowMs = t0,
                wasOffline = false,
                isOnline = true
            )
        )
    }

    @Test
    fun `network errors are classified as transient and never treated as revoked sessions`() {
        val networkErr = FirebaseNetworkException("A network error (such as timeout, interrupted connection or unreachable host) has occurred.")
        val ioErr = IOException("Unable to resolve host securetoken.googleapis.com")
        val revokedErr = FirebaseAuthInvalidUserException("ERROR_USER_DISABLED", "User account has been disabled.")

        assertTrue(isTransientAuthRefreshError(networkErr))
        assertTrue(isTransientAuthRefreshError(ioErr))
        assertFalse(isRevokedOrDeletedAccountError(networkErr))
        assertFalse(isRevokedOrDeletedAccountError(ioErr))
        assertTrue(isRevokedOrDeletedAccountError(revokedErr))
    }

    @Test
    fun `sessionPersistenceStore caches profile strictly per UID and clears on explicit sign-out`() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val store = SessionPersistenceStore(context)

        val studentProfile = UserProfile(
            id = "uid_student_1",
            userId = "uid_student_1",
            displayName = "Ananya Roy",
            email = "ananya@college.edu",
            role = "STUDENT",
            institutionOrVillage = "BCKV Nadia",
            district = "Nadia, WB",
            semester = 5L,
            language = "EN"
        )

        store.markSignedIn("uid_student_1", nowMs = 1_700_000_000L)
        store.cacheUserProfile(studentProfile)

        val restored = store.getCachedProfileForUser("uid_student_1")
        assertNotNull(restored)
        assertEquals("Ananya Roy", restored?.displayName)
        assertEquals(5L, restored?.semester)
        assertFalse(store.readMetadata().explicitlyLoggedOut)

        // Multi-user isolation: another UID must NEVER read uid_student_1's cached profile
        assertNull(store.getCachedProfileForUser("uid_other_student"))

        // Explicit sign-out sets explicitlyLoggedOut = true and wipes cached profile
        store.markExplicitSignOut()
        val afterLogout = store.readMetadata()
        assertTrue(afterLogout.explicitlyLoggedOut)
        assertEquals("", afterLogout.lastUserId)
        assertNull(store.getCachedProfileForUser("uid_student_1"))
    }
}
