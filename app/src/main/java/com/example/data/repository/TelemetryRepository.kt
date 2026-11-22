package com.example.data.repository

import android.util.Log
import com.example.core.OperationType
import com.example.core.handleFirestoreError
import com.example.data.model.ActivityEvent
import com.example.data.model.AdminAuditLog
import com.example.data.model.AiUsageLog
import com.example.data.model.ContentReport
import com.example.data.model.ErrorLog
import com.example.data.model.ExamStat
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

private const val TELEM_TAG = "TelemetryRepository"

class TelemetryRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google.")

    suspend fun touchUserPresence(): Result<Unit> {
        val uid = auth.currentUser?.uid ?: return Result.failure(IllegalStateException("Not signed in"))
        val path = "users/$uid"
        return try {
            db.collection("users").document(uid).update(
                mapOf(
                    "lastActiveAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // Silently ignore if profile document does not exist yet (first-time onboarding)
            Log.d(TELEM_TAG, "touchUserPresence skipped ($path): ${e.localizedMessage}")
            Result.failure(e)
        }
    }

    suspend fun logActivityEvent(
        userRole: String,
        eventType: String,
        module: String,
        detail: String
    ): Result<Unit> {
        var path = "activityEvents"
        return try {
            val uid = requireUserId()
            val safeRole = when (userRole) {
                "FARMER", "ADMIN" -> userRole
                else -> "STUDENT"
            }
            val safeType = when (eventType) {
                "APP_SESSION", "STUDY_VIEW", "EXAM_COMPLETED", "QUERY_SUBMITTED",
                "POST_CREATED", "TOOL_USED", "MATERIAL_UPLOADED" -> eventType
                else -> "APP_SESSION"
            }
            val safeModule = when (module) {
                "STUDENT", "FARMER", "TOOLS", "AI", "COMMUNITY", "CAREER", "ADMIN" -> module
                else -> "STUDENT"
            }
            val docRef = db.collection("activityEvents").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "userRole" to safeRole,
                    "eventType" to safeType,
                    "module" to safeModule,
                    "detail" to detail.trim().take(200),
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

    suspend fun logExamStat(
        semester: Long,
        score: Long,
        totalQuestions: Long
    ): Result<Unit> {
        var path = "examStats"
        return try {
            val uid = requireUserId()
            val safeTotal = totalQuestions.coerceIn(1L, 200L)
            val safeScore = score.coerceIn(0L, safeTotal)
            val pct = ((safeScore * 100L) / safeTotal).coerceIn(0L, 100L)
            val docRef = db.collection("examStats").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "semester" to semester.coerceIn(1L, 8L),
                    "score" to safeScore,
                    "totalQuestions" to safeTotal,
                    "percentage" to pct,
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

    suspend fun logAiUsage(
        modelName: String,
        feature: String,
        language: String,
        promptTokens: Long,
        outputTokens: Long,
        latencyMs: Long,
        success: Boolean,
        hasImage: Boolean
    ): Result<Unit> {
        var path = "aiUsageLogs"
        return try {
            val uid = requireUserId()
            val safeFeature = when (feature) {
                "CROP_PHOTO_SCAN", "PDF_EXTRACT", "HEALTH_CHECK" -> feature
                else -> "AI_CHAT"
            }
            val safeLang = if (language == "BN") "BN" else "EN"
            val docRef = db.collection("aiUsageLogs").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "modelName" to modelName.trim().ifBlank { "gemini-3.8-flash" }.take(80),
                    "feature" to safeFeature,
                    "language" to safeLang,
                    "promptTokens" to promptTokens.coerceIn(0L, 2_000_000L),
                    "outputTokens" to outputTokens.coerceIn(0L, 2_000_000L),
                    "latencyMs" to latencyMs.coerceIn(0L, 300_000L),
                    "success" to success,
                    "hasImage" to hasImage,
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

    suspend fun logError(
        source: String,
        severity: String,
        module: String,
        message: String
    ): Result<Unit> {
        var path = "errorLogs"
        return try {
            val uid = requireUserId()
            val safeSource = when (source) {
                "FIRESTORE", "AI_LOGIC", "AUTH", "SYSTEM" -> source
                else -> "SYSTEM"
            }
            val safeSeverity = when (severity) {
                "INFO", "WARNING", "CRITICAL" -> severity
                else -> "WARNING"
            }
            val docRef = db.collection("errorLogs").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "userId" to uid,
                    "source" to safeSource,
                    "severity" to safeSeverity,
                    "module" to module.trim().ifBlank { "App" }.take(60),
                    "message" to message.trim().ifBlank { "Unknown system error" }.take(500),
                    "resolved" to false,
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TELEM_TAG, "Could not persist error log ($path): ${e.localizedMessage}")
            Result.failure(e)
        }
    }

    suspend fun resolveErrorLog(errorId: String, resolved: Boolean = true): Result<Unit> {
        val path = "errorLogs/$errorId"
        return try {
            requireUserId()
            db.collection("errorLogs").document(errorId).update("resolved", resolved).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteErrorLog(errorId: String): Result<Unit> {
        val path = "errorLogs/$errorId"
        return try {
            requireUserId()
            db.collection("errorLogs").document(errorId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    suspend fun submitContentReport(
        reporterName: String,
        targetId: String,
        targetTitle: String,
        reason: String
    ): Result<Unit> {
        var path = "contentReports"
        return try {
            val uid = requireUserId()
            require(reason.trim().length in 3..300) { "Please provide a brief reason (3–300 characters)." }
            val docRef = db.collection("contentReports").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "reporterId" to uid,
                    "reporterName" to reporterName.trim().ifBlank { "Member" }.take(80),
                    "targetType" to "COMMUNITY_POST",
                    "targetId" to targetId.trim().take(128),
                    "targetTitle" to targetTitle.trim().ifBlank { "Community Post" }.take(140),
                    "reason" to reason.trim().take(300),
                    "status" to "PENDING",
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

    suspend fun resolveContentReport(reportId: String, status: String): Result<Unit> {
        val path = "contentReports/$reportId"
        return try {
            requireUserId()
            val safeStatus = when (status) {
                "DISMISSED", "ACTION_TAKEN" -> status
                else -> "PENDING"
            }
            db.collection("contentReports").document(reportId).update(
                mapOf(
                    "status" to safeStatus,
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

    // --- OWNER-ONLY REAL-TIME OBSERVERS (Strictly instantiated only for verified Super Admin) ---

    fun observeActivityEvents(): Flow<List<ActivityEvent>> = flow {
        val uid = requireUserId()
        val path = "activityEvents"
        emitAll(
            db.collection(path).limit(300).snapshots()
                .map { snap ->
                    snap.toObjects(
                        ActivityEvent::class.java,
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

    fun observeExamStats(): Flow<List<ExamStat>> = flow {
        val uid = requireUserId()
        val path = "examStats"
        emitAll(
            db.collection(path).limit(300).snapshots()
                .map { snap ->
                    snap.toObjects(
                        ExamStat::class.java,
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

    fun observeAiUsageLogs(): Flow<List<AiUsageLog>> = flow {
        val uid = requireUserId()
        val path = "aiUsageLogs"
        emitAll(
            db.collection(path).limit(300).snapshots()
                .map { snap ->
                    snap.toObjects(
                        AiUsageLog::class.java,
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

    fun observeErrorLogs(): Flow<List<ErrorLog>> = flow {
        val uid = requireUserId()
        val path = "errorLogs"
        emitAll(
            db.collection(path).limit(200).snapshots()
                .map { snap ->
                    snap.toObjects(
                        ErrorLog::class.java,
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

    fun observeContentReports(): Flow<List<ContentReport>> = flow {
        val uid = requireUserId()
        val path = "contentReports"
        emitAll(
            db.collection(path).limit(200).snapshots()
                .map { snap ->
                    snap.toObjects(
                        ContentReport::class.java,
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

    suspend fun logAdminAuditAction(
        action: String,
        targetType: String,
        targetId: String,
        summary: String
    ): Result<Unit> {
        var path = "adminAuditLogs"
        return try {
            val user = auth.currentUser
                ?: throw IllegalStateException("Founder authentication required.")
            val docRef = db.collection("adminAuditLogs").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "actorUid" to user.uid,
                    "actorEmail" to (user.email ?: "founder@gurujivision.in").take(120),
                    "action" to action.trim().ifBlank { "ADMIN_ACTION" }.take(80),
                    "targetType" to targetType.trim().ifBlank { "SYSTEM" }.take(60),
                    "targetId" to targetId.trim().take(128),
                    "summary" to summary.trim().ifBlank { action }.take(300),
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TELEM_TAG, "Audit log skipped ($path): ${e.localizedMessage}")
            Result.failure(e)
        }
    }

    fun observeAdminAuditLogs(): Flow<List<AdminAuditLog>> = flow {
        val uid = requireUserId()
        val path = "adminAuditLogs"
        emitAll(
            db.collection(path).limit(200).snapshots()
                .map { snap ->
                    snap.toObjects(
                        AdminAuditLog::class.java,
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
}
