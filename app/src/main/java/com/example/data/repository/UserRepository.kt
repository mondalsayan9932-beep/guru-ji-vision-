package com.example.data.repository

import com.example.core.OperationType
import com.example.core.handleFirestoreError
import com.example.data.model.AdminRecord
import com.example.data.model.UserProfile
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.retryWhen
import kotlinx.coroutines.flow.transform
import kotlinx.coroutines.tasks.await

private const val SUPER_ADMIN_EMAIL = "mondalsayan9932@gmail.com"

fun sanitizePublicAccountRole(role: String): String =
    if (role.trim().equals("FARMER", ignoreCase = true)) "FARMER" else "STUDENT"

class UserRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google.")

    fun isSuperAdminCurrentUser(): Boolean {
        val user = auth.currentUser ?: return false
        return user.email.equals(SUPER_ADMIN_EMAIL, ignoreCase = true) && user.isEmailVerified
    }

    fun hasAdminCustomClaim(claims: Map<String, Any?>): Boolean {
        return (claims["admin"] == true) ||
            (claims["founder"] == true) ||
            (claims["role"]?.toString().equals("FOUNDER", ignoreCase = true)) ||
            (claims["role"]?.toString().equals("ADMIN", ignoreCase = true))
    }

    /**
     * Verifies Owner/Admin identity against Firebase Authentication ID token Custom Claims
     * (`admin == true`, `founder == true`, or `role == "FOUNDER"`) or verified Founder Google email.
     * Never grants Admin privileges from frontend Firestore fields alone.
     */
    fun observeIsFounder(userId: String): Flow<Boolean> = flow {
        val user = auth.currentUser
        if (user == null || user.uid != userId) {
            emit(false)
            return@flow
        }
        val emailMatch = user.email.equals(SUPER_ADMIN_EMAIL, ignoreCase = true) && user.isEmailVerified
        if (emailMatch) {
            emit(true)
            return@flow
        }
        val claimMatch = try {
            val tokenResult = user.getIdToken(false).await()
            hasAdminCustomClaim(tokenResult.claims)
        } catch (_: Exception) {
            false
        }
        emit(claimMatch)
    }

    fun observeProfile(userId: String): Flow<UserProfile?> = flow {
        require(userId.isNotBlank()) { "User ID required" }
        val path = "users/$userId"
        emitAll(
            db.collection("users").document(userId)
                .snapshots()
                .transform { snap ->
                    if (snap.exists()) {
                        emit(
                            snap.toObject(
                                UserProfile::class.java,
                                DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                            )
                        )
                    } else if (!snap.metadata.isFromCache) {
                        // Only treat missing profile as a brand-new user when confirmed by server;
                        // an offline cache miss must NEVER redirect returning users to Onboarding.
                        emit(null)
                    }
                }
                .retryWhen { error, attempt ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) return@retryWhen false
                    val retryable = isRetryableSessionFirestoreError(firestoreError, isSignedIn = auth.currentUser?.uid == userId)
                    if (retryable && attempt < 6) {
                        delay(((attempt + 1L) * 1_500L).coerceAtMost(8_000L))
                        true
                    } else {
                        false
                    }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == userId) {
                        handleFirestoreError(toLog, OperationType.GET, path)
                    }
                    throw error
                }
        )
    }

    private fun isRetryableSessionFirestoreError(
        error: FirebaseFirestoreException?,
        isSignedIn: Boolean
    ): Boolean {
        if (error == null) return false
        return when (error.code) {
            FirebaseFirestoreException.Code.UNAVAILABLE,
            FirebaseFirestoreException.Code.DEADLINE_EXCEEDED,
            FirebaseFirestoreException.Code.ABORTED,
            FirebaseFirestoreException.Code.INTERNAL,
            FirebaseFirestoreException.Code.RESOURCE_EXHAUSTED -> true
            // Brief token rotation blip while FirebaseAuth still holds the active signed-in user
            FirebaseFirestoreException.Code.UNAUTHENTICATED -> isSignedIn
            else -> false
        }
    }

    fun observeIsAdmin(userId: String): Flow<Boolean> = flow {
        if (isSuperAdminCurrentUser()) {
            emit(true)
            return@flow
        }
        val path = "admins/$userId"
        emitAll(
            db.collection("admins").document(userId)
                .snapshots()
                .map { snap -> snap.exists() }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    emit(false)
                }
        )
    }

    fun observeAllUsersForAdmin(): Flow<List<UserProfile>> = flow {
        val uid = requireUserId()
        val path = "users"
        emitAll(
            db.collection("users")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        UserProfile::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    fun observeAdmins(): Flow<List<AdminRecord>> = flow {
        val uid = requireUserId()
        val path = "admins"
        emitAll(
            db.collection("admins")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        AdminRecord::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun createOrUpdateProfile(
        displayName: String,
        role: String,
        institutionOrVillage: String,
        district: String,
        semester: Long,
        language: String,
        isExisting: Boolean
    ): Result<Unit> {
        var path = "users/unknown"
        return try {
            val user = auth.currentUser
                ?: throw IllegalStateException("User must be signed in with Google.")
            val uid = user.uid
            path = "users/$uid"
            val safeName = displayName.trim().take(80).ifBlank { user.displayName ?: "Member" }
            val safeRole = sanitizePublicAccountRole(role)
            val safeLang = if (language == "BN") "BN" else "EN"
            val safeSem = if (safeRole == "STUDENT") semester.coerceIn(1L, 8L) else 0L
            val safeEmail = (user.email ?: "user@gurujivision.in").take(120)
            val safePhotoUrl = user.photoUrl?.toString()?.trim()?.take(500).orEmpty()

            val docRef = db.collection("users").document(uid)
            if (isExisting) {
                docRef.update(
                    mapOf(
                        "displayName" to safeName,
                        "role" to safeRole,
                        "institutionOrVillage" to institutionOrVillage.trim().take(120),
                        "district" to district.trim().take(80),
                        "semester" to safeSem,
                        "language" to safeLang,
                        "photoUrl" to safePhotoUrl,
                        "lastActiveAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(
                    mapOf(
                        "userId" to uid,
                        "displayName" to safeName,
                        "email" to safeEmail,
                        "role" to safeRole,
                        "institutionOrVillage" to institutionOrVillage.trim().take(120),
                        "district" to district.trim().take(80),
                        "semester" to safeSem,
                        "language" to safeLang,
                        "photoUrl" to safePhotoUrl,
                        "lastActiveAt" to FieldValue.serverTimestamp(),
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, if (isExisting) OperationType.UPDATE else OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun addAdminStaff(targetUid: String, email: String, roleTitle: String): Result<Unit> {
        val cleanUid = targetUid.trim()
        val path = "admins/$cleanUid"
        return try {
            val uid = requireUserId()
            require(cleanUid.matches(Regex("^[a-zA-Z0-9_\\-]{1,128}$"))) { "Invalid target User UID format." }
            require(email.trim().length in 3..120) { "Enter a valid email address." }
            require(roleTitle.trim().length in 2..60) { "Role title must be 2–60 characters." }

            db.collection("admins").document(cleanUid).set(
                mapOf(
                    "email" to email.trim().take(120),
                    "roleTitle" to roleTitle.trim().take(60),
                    "addedBy" to uid,
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun removeAdminStaff(targetUid: String): Result<Unit> {
        val path = "admins/$targetUid"
        return try {
            requireUserId()
            db.collection("admins").document(targetUid).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }
}
