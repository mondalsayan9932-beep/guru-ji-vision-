package com.example.data.repository

import android.graphics.Bitmap
import android.util.Base64
import com.example.core.OperationType
import com.example.core.handleFirestoreError
import com.example.data.model.DoubtChatThread
import com.example.data.model.DoubtMessage
import com.example.data.model.ProfessorAccountLink
import com.example.data.model.ProfessorDirectorySeed
import com.example.data.model.ProfessorProfile
import com.example.data.model.buildDoubtChatId
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
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.io.ByteArrayOutputStream
import java.util.Locale

data class FacultyIdentity(
    val isAuthorizedProfessor: Boolean = false,
    val canHostMeetings: Boolean = false,
    val professorId: String = "",
    val professorName: String = "",
    val matchedByEmail: String = "",
    val matchedByAccountLink: Boolean = false
)

class DoubtRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google.")

    /**
     * Observes the active Professor Directory merged with the authoritative 9-faculty seed
     * so all 9 advisors are always displayed while Founder updates sync in real time.
     */
    fun observeProfessors(includeInactiveForAdmin: Boolean = false): Flow<List<ProfessorProfile>> = flow {
        val uid = requireUserId()
        val path = "professors"
        val query = if (includeInactiveForAdmin) {
            db.collection(path).limit(100)
        } else {
            db.collection(path).whereEqualTo("active", true).limit(100)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    val remote = snap.toObjects(
                        ProfessorProfile::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                    if (includeInactiveForAdmin) {
                        val merged = linkedMapOf<String, ProfessorProfile>()
                        ProfessorDirectorySeed.officialFaculty.forEach { merged[it.id] = it }
                        remote.forEach { if (it.id.isNotBlank()) merged[it.id] = it }
                        merged.values.sortedWith(compareBy<ProfessorProfile> { it.displayOrder }.thenBy { it.name })
                    } else {
                        ProfessorDirectorySeed.mergeWithRemote(remote)
                    }
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
                    emit(ProfessorDirectorySeed.officialFaculty)
                }
        )
    }

    /**
     * Determines whether the signed-in Google user is an authorized professor via either:
     * 1) Verified official faculty Google email matching the faculty directory, OR
     * 2) Founder-managed /professorAccounts/{uid} record (e.g. for faculty without pre-seeded emails).
     */
    fun observeCurrentFacultyIdentity(userId: String): Flow<FacultyIdentity> = flow {
        val currentUser = auth.currentUser
        if (currentUser == null || currentUser.uid != userId) {
            emit(FacultyIdentity())
            return@flow
        }
        val verifiedEmail = if (currentUser.isEmailVerified) {
            currentUser.email?.trim()?.lowercase(Locale.ROOT).orEmpty()
        } else {
            ""
        }
        val accountDocFlow = db.collection("professorAccounts").document(userId)
            .snapshots()
            .map { snap ->
                if (snap.exists()) {
                    snap.toObject(
                        ProfessorAccountLink::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                } else null
            }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                emit(null)
            }

        emitAll(
            combine(accountDocFlow, observeProfessors(includeInactiveForAdmin = false)) { accountLink, professors ->
                val activeLink = accountLink?.takeIf { it.active && it.professorId.isNotBlank() }
                if (activeLink != null) {
                    val matchedProf = professors.firstOrNull { it.id == activeLink.professorId }
                    FacultyIdentity(
                        isAuthorizedProfessor = true,
                        canHostMeetings = activeLink.canHostMeetings,
                        professorId = activeLink.professorId,
                        professorName = matchedProf?.name ?: currentUser.displayName.orEmpty().ifBlank { "Professor" },
                        matchedByEmail = verifiedEmail,
                        matchedByAccountLink = true
                    )
                } else if (verifiedEmail.isNotBlank()) {
                    val matchedByEmailProf = professors.firstOrNull {
                        it.email.equals(verifiedEmail, ignoreCase = true)
                    } ?: ProfessorDirectorySeed.findByEmail(verifiedEmail)
                    if (matchedByEmailProf != null) {
                        FacultyIdentity(
                            isAuthorizedProfessor = true,
                            canHostMeetings = matchedByEmailProf.canHostMeetings,
                            professorId = matchedByEmailProf.id,
                            professorName = matchedByEmailProf.name,
                            matchedByEmail = verifiedEmail,
                            matchedByAccountLink = false
                        )
                    } else {
                        FacultyIdentity()
                    }
                } else {
                    FacultyIdentity()
                }
            }
        )
    }

    /**
     * Observes the current student's own private conversations (strictly scoped by studentId == uid).
     */
    fun observeStudentThreads(studentId: String): Flow<List<DoubtChatThread>> = flow {
        val uid = requireUserId()
        require(uid == studentId) { "Students can only observe their own private conversations." }
        val path = "doubtChats"
        emitAll(
            db.collection(path)
                .whereEqualTo("studentId", studentId)
                .limit(100)
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        DoubtChatThread::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.updatedAt?.seconds ?: 0L }
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

    /**
     * Observes private student conversations assigned strictly to the authenticated professor.
     */
    fun observeProfessorAssignedThreads(identity: FacultyIdentity): Flow<List<DoubtChatThread>> = flow {
        val uid = requireUserId()
        if (!identity.isAuthorizedProfessor) {
            emit(emptyList())
            return@flow
        }
        val path = "doubtChats"
        val query = when {
            identity.matchedByAccountLink && identity.professorId.isNotBlank() ->
                db.collection(path).whereEqualTo("professorId", identity.professorId).limit(200)
            identity.matchedByEmail.isNotBlank() ->
                db.collection(path).whereEqualTo("professorEmail", identity.matchedByEmail).limit(200)
            else -> {
                emit(emptyList())
                return@flow
            }
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        DoubtChatThread::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.updatedAt?.seconds ?: 0L }
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

    /**
     * Observes real-time messages inside a single private student-professor chat room
     * using participant-aligned query predicates matching firestore.rules `allow list`.
     */
    fun observeMessages(
        chatId: String,
        asProfessor: Boolean,
        identity: FacultyIdentity,
        studentId: String
    ): Flow<List<DoubtMessage>> = flow {
        val uid = requireUserId()
        val path = "doubtChats/$chatId/messages"
        val collectionRef = db.collection("doubtChats").document(chatId).collection("messages")
        val query = if (asProfessor) {
            when {
                identity.matchedByAccountLink && identity.professorId.isNotBlank() ->
                    collectionRef.whereEqualTo("professorId", identity.professorId).limit(250)
                identity.matchedByEmail.isNotBlank() ->
                    collectionRef.whereEqualTo("professorEmail", identity.matchedByEmail).limit(250)
                else -> collectionRef.whereEqualTo("professorUid", uid).limit(250)
            }
        } else {
            collectionRef.whereEqualTo("studentId", studentId).limit(250)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        DoubtMessage::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedBy { it.createdAt?.seconds ?: Long.MAX_VALUE }
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

    /**
     * Sends a text and/or compressed image message inside a private (professor, student) room.
     * Creates the deterministic thread document if this is the student's first message to this professor.
     */
    suspend fun sendMessage(
        professor: ProfessorProfile,
        studentId: String,
        studentName: String,
        studentSemester: Long,
        senderRole: String,
        senderName: String,
        text: String,
        imageBitmap: Bitmap?
    ): Result<String> {
        val chatId = buildDoubtChatId(professor.id, studentId)
        var path = "doubtChats/$chatId"
        return try {
            val uid = requireUserId()
            val cleanText = text.trim().take(2000)
            val encodedImage = imageBitmap?.let { compressBitmapToBase64(it) }
            val hasImg = !encodedImage.isNullOrBlank()
            require(cleanText.isNotEmpty() || hasImg) { "Enter a doubt message or attach an image." }

            val threadRef = db.collection("doubtChats").document(chatId)
            val threadSnap = runCatching { threadRef.get().await() }.getOrNull()
            val existingThread = if (threadSnap != null && threadSnap.exists()) {
                threadSnap.toObject(
                    DoubtChatThread::class.java,
                    DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                )
            } else null

            val preview = when {
                cleanText.isNotBlank() -> cleanText.take(180)
                hasImg -> "[Photo attachment]"
                else -> ""
            }
            val profEmailLower = (existingThread?.professorEmail ?: professor.email).trim().lowercase(Locale.ROOT)
            val existingProfUid = existingThread?.professorUid?.takeIf { it.isNotBlank() }
            val effectiveProfUid = when {
                senderRole == "PROFESSOR" -> uid
                existingProfUid != null -> existingProfUid
                else -> professor.authorizedUid.trim()
            }

            val batch = db.batch()
            if (existingThread == null) {
                require(senderRole == "STUDENT" && studentId == uid) {
                    "Only the student can initiate a new doubt thread."
                }
                batch.set(
                    threadRef,
                    mapOf(
                        "studentId" to uid,
                        "studentName" to studentName.trim().ifBlank { "Student" }.take(80),
                        "studentSemester" to studentSemester.coerceIn(0L, 8L),
                        "professorId" to professor.id,
                        "professorName" to professor.name.take(100),
                        "professorEmail" to profEmailLower.take(120),
                        "professorUid" to effectiveProfUid.take(128),
                        "lastMessagePreview" to preview,
                        "lastSenderRole" to "STUDENT",
                        "unreadForStudent" to 0L,
                        "unreadForProfessor" to 1L,
                        "studentLastReadAt" to FieldValue.serverTimestamp(),
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                )
            } else {
                val nextUnreadStudent = if (senderRole == "PROFESSOR") existingThread.unreadForStudent + 1L else 0L
                val nextUnreadProf = if (senderRole == "STUDENT") existingThread.unreadForProfessor + 1L else 0L
                val updateMap = if (senderRole == "STUDENT") {
                    mapOf(
                        "studentName" to studentName.trim().ifBlank { existingThread.studentName }.take(80),
                        "studentSemester" to studentSemester.coerceIn(0L, 8L),
                        "lastMessagePreview" to preview,
                        "lastSenderRole" to "STUDENT",
                        "unreadForStudent" to nextUnreadStudent,
                        "unreadForProfessor" to nextUnreadProf,
                        "studentLastReadAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                } else {
                    mapOf(
                        "professorName" to professor.name.ifBlank { existingThread.professorName }.take(100),
                        "professorUid" to effectiveProfUid.take(128),
                        "lastMessagePreview" to preview,
                        "lastSenderRole" to "PROFESSOR",
                        "unreadForStudent" to nextUnreadStudent,
                        "unreadForProfessor" to nextUnreadProf,
                        "professorLastReadAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                }
                batch.update(threadRef, updateMap)
            }

            val msgRef = threadRef.collection("messages").document()
            path = msgRef.path
            val msgPayload = buildMap<String, Any> {
                put("studentId", existingThread?.studentId ?: studentId)
                put("professorId", existingThread?.professorId ?: professor.id)
                put("professorEmail", profEmailLower.take(120))
                put("professorUid", effectiveProfUid.take(128))
                put("senderId", uid)
                put("senderName", senderName.trim().ifBlank { if (senderRole == "PROFESSOR") professor.name else "Student" }.take(80))
                put("senderRole", senderRole)
                put("text", cleanText)
                put("hasImage", hasImg)
                encodedImage?.takeIf { it.isNotBlank() }?.let { safeImg ->
                    put("imageBase64", safeImg)
                }
                put("readByRecipient", false)
                put("createdAt", FieldValue.serverTimestamp())
            }
            batch.set(msgRef, msgPayload)
            batch.commit().await()

            Result.success(chatId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    /**
     * Marks unread incoming messages and the thread unread counter as read for the active viewer.
     */
    suspend fun markConversationRead(
        thread: DoubtChatThread,
        messages: List<DoubtMessage>,
        asProfessor: Boolean
    ) {
        val uid = auth.currentUser?.uid ?: return
        try {
            val threadRef = db.collection("doubtChats").document(thread.id)
            val shouldClearThread = if (asProfessor) thread.unreadForProfessor > 0L else thread.unreadForStudent > 0L
            if (shouldClearThread) {
                val update = if (asProfessor) {
                    mapOf(
                        "unreadForProfessor" to 0L,
                        "professorLastReadAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                } else {
                    mapOf(
                        "unreadForStudent" to 0L,
                        "studentLastReadAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                }
                threadRef.update(update).await()
            }
            val unreadIncoming = messages.filter { !it.readByRecipient && it.senderId != uid && it.id.isNotBlank() }
            if (unreadIncoming.isNotEmpty()) {
                val batch = db.batch()
                unreadIncoming.take(40).forEach { msg ->
                    batch.update(threadRef.collection("messages").document(msg.id), mapOf("readByRecipient" to true))
                }
                batch.commit().await()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            // Non-blocking read-receipt sync
        }
    }

    suspend fun deleteOwnMessage(chatId: String, messageId: String): Result<Unit> {
        val path = "doubtChats/$chatId/messages/$messageId"
        return try {
            requireUserId()
            db.collection("doubtChats").document(chatId)
                .collection("messages").document(messageId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    // --- ADMIN / FOUNDER FACULTY DIRECTORY MANAGEMENT (Never accesses private chats!) ---

    suspend fun syncDefaultProfessorsAsAdmin(): Result<Unit> {
        val path = "professors"
        return try {
            requireUserId()
            val batch = db.batch()
            val now = FieldValue.serverTimestamp()
            ProfessorDirectorySeed.officialFaculty.forEach { prof ->
                batch.set(
                    db.collection("professors").document(prof.id),
                    mapOf(
                        "name" to prof.name,
                        "designation" to prof.designation,
                        "qualification" to prof.qualification,
                        "subject" to prof.subject,
                        "department" to prof.department,
                        "email" to prof.email.lowercase(Locale.ROOT),
                        "specialization" to prof.specialization,
                        "avatarUrl" to prof.avatarUrl,
                        "authorizedUid" to prof.authorizedUid,
                        "canHostMeetings" to prof.canHostMeetings,
                        "active" to prof.active,
                        "displayOrder" to prof.displayOrder,
                        "updatedAt" to now
                    )
                )
            }
            batch.commit().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun saveProfessorProfileAsAdmin(profile: ProfessorProfile): Result<Unit> {
        val cleanId = profile.id.trim().ifBlank {
            "prof_" + profile.name.lowercase(Locale.ROOT)
                .replace(Regex("[^a-z0-9]+"), "_")
                .trim('_')
                .take(40)
        }
        val path = "professors/$cleanId"
        return try {
            val adminUid = requireUserId()
            require(profile.name.trim().length in 2..100) { "Professor name is required." }
            require(profile.designation.trim().length in 2..100) { "Designation is required." }
            require(profile.department.trim().length in 2..100) { "Department is required." }
            require(profile.specialization.trim().length in 2..200) { "Specialization is required." }

            val cleanEmail = profile.email.trim().lowercase(Locale.ROOT).take(120)
            val cleanAuthUid = profile.authorizedUid.trim().take(128)

            db.collection("professors").document(cleanId).set(
                mapOf(
                    "name" to profile.name.trim().take(100),
                    "designation" to profile.designation.trim().take(100),
                    "qualification" to profile.qualification.trim().take(100),
                    "subject" to profile.subject.trim().take(80),
                    "department" to profile.department.trim().take(100),
                    "email" to cleanEmail,
                    "specialization" to profile.specialization.trim().take(200),
                    "avatarUrl" to profile.avatarUrl.trim().take(500),
                    "authorizedUid" to cleanAuthUid,
                    "canHostMeetings" to profile.canHostMeetings,
                    "active" to profile.active,
                    "displayOrder" to profile.displayOrder.coerceIn(0L, 100L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            // If Founder linked a Google Firebase UID, also upsert /professorAccounts/{uid}
            if (cleanAuthUid.isNotBlank()) {
                db.collection("professorAccounts").document(cleanAuthUid).set(
                    mapOf(
                        "professorId" to cleanId,
                        "email" to cleanEmail,
                        "canHostMeetings" to profile.canHostMeetings,
                        "active" to profile.active,
                        "addedBy" to adminUid,
                        "createdAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }

            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    private fun compressBitmapToBase64(bitmap: Bitmap): String {
        val maxDim = 720
        val scale = minOf(1f, maxDim.toFloat() / maxOf(bitmap.width, bitmap.height).coerceAtLeast(1))
        val resized = if (scale < 1f) {
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * scale).toInt().coerceAtLeast(1),
                (bitmap.height * scale).toInt().coerceAtLeast(1),
                true
            )
        } else bitmap

        var quality = 70
        var encoded = ""
        while (quality >= 30) {
            val out = ByteArrayOutputStream()
            resized.compress(Bitmap.CompressFormat.JPEG, quality, out)
            encoded = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
            if (encoded.length <= 320_000) break
            quality -= 15
        }
        require(encoded.length <= 340_000) { "Selected image is too large. Please pick a smaller image." }
        return encoded
    }
}
