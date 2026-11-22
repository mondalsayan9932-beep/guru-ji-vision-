package com.example.data.repository

import com.example.core.OperationType
import com.example.core.handleFirestoreError
import com.example.data.model.FarmerQuery
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

class FarmerRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google.")

    // Aligned strictly with firestore.rules: farmerQueries requires whereEqualTo("userId", uid) for non-admins
    fun observeMyQueries(userId: String): Flow<List<FarmerQuery>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Refusing cross-farmer query read." }
        val path = "farmerQueries"
        emitAll(
            db.collection("farmerQueries")
                .whereEqualTo("userId", uid)
                .limit(100)
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        FarmerQuery::class.java,
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

    fun observeAllQueriesForAdmin(): Flow<List<FarmerQuery>> = flow {
        val uid = requireUserId()
        val path = "farmerQueries"
        emitAll(
            db.collection("farmerQueries")
                .limit(250)
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        FarmerQuery::class.java,
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

    suspend fun submitQuery(
        farmerName: String,
        cropName: String,
        category: String,
        description: String,
        district: String,
        hasImage: Boolean,
        imageSummary: String
    ): Result<Unit> {
        var path = "farmerQueries"
        return try {
            val uid = requireUserId()
            require(cropName.trim().length in 1..80) { "Crop name is required (1–80 chars)." }
            require(description.trim().length in 5..1000) { "Please describe your crop issue (at least 5 chars)." }

            val docRef = db.collection("farmerQueries").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "farmerName" to farmerName.trim().ifBlank { "Farmer" }.take(80),
                    "cropName" to cropName.trim().take(80),
                    "category" to category,
                    "description" to description.trim().take(1000),
                    "district" to district.trim().take(80),
                    "hasImage" to hasImage,
                    "imageSummary" to imageSummary.trim().take(400),
                    "status" to "OPEN",
                    "adminReply" to "",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
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

    suspend fun replyToQueryAsAdmin(
        queryId: String,
        status: String,
        adminReply: String
    ): Result<Unit> {
        val path = "farmerQueries/$queryId"
        return try {
            requireUserId()
            require(queryId.isNotBlank())
            val safeStatus = if (status in listOf("OPEN", "IN_REVIEW", "RESOLVED")) status else "IN_REVIEW"
            db.collection("farmerQueries").document(queryId).update(
                mapOf(
                    "status" to safeStatus,
                    "adminReply" to adminReply.trim().take(1000),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteQuery(queryId: String): Result<Unit> {
        val path = "farmerQueries/$queryId"
        return try {
            requireUserId()
            db.collection("farmerQueries").document(queryId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }
}
