package com.example.data.repository

import com.example.core.OperationType
import com.example.core.handleFirestoreError
import com.example.data.model.MeetingSession
import com.example.data.model.isValidGoogleMeetUrl
import com.example.data.model.parseMeetingEpochMs
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

class MeetingRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google.")

    fun observeMeetings(includeUnpublishedForHost: Boolean = false): Flow<List<MeetingSession>> = flow {
        val uid = requireUserId()
        val path = "meetings"
        val query = if (includeUnpublishedForHost) {
            db.collection(path)
        } else {
            db.collection(path).whereEqualTo("published", true)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        MeetingSession::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedBy { it.scheduledAtEpochMs }
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

    suspend fun createMeeting(
        title: String,
        subject: String,
        description: String,
        meetUrl: String,
        scheduledDate: String,
        scheduledTime: String,
        hostName: String,
        notifyStudents: Boolean
    ): Result<String> {
        var path = "meetings"
        return try {
            val uid = requireUserId()
            val cleanTitle = title.trim().take(150)
            val cleanSubject = subject.trim().take(80)
            val cleanDesc = description.trim().take(1000)
            val cleanUrl = meetUrl.trim().take(300)
            val cleanDate = scheduledDate.trim().take(20)
            val cleanTime = scheduledTime.trim().take(20)
            val cleanHost = hostName.trim().ifBlank { auth.currentUser?.displayName ?: "Faculty" }.take(80)

            require(cleanTitle.length >= 2) { "Meeting title must be at least 2 characters." }
            require(cleanSubject.length >= 2) { "Subject is required." }
            require(isValidGoogleMeetUrl(cleanUrl)) {
                "Please enter a valid Google Meet link (e.g. https://meet.google.com/abc-defg-hij)."
            }
            require(cleanDate.length >= 8) { "Please enter a valid date (YYYY-MM-DD)." }
            require(cleanTime.length >= 3) { "Please enter a valid time (e.g. 04:00 PM)." }

            val epochMs = parseMeetingEpochMs(cleanDate, cleanTime)
            val docRef = db.collection("meetings").document()
            path = docRef.path

            docRef.set(
                mapOf(
                    "title" to cleanTitle,
                    "subject" to cleanSubject,
                    "description" to cleanDesc,
                    "meetUrl" to cleanUrl,
                    "scheduledDate" to cleanDate,
                    "scheduledTime" to cleanTime,
                    "scheduledAtEpochMs" to epochMs,
                    "hostName" to cleanHost,
                    "hostUid" to uid,
                    "notifyStudents" to notifyStudents,
                    "published" to true,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            if (notifyStudents) {
                runCatching {
                    val noticeRef = db.collection("announcements").document()
                    noticeRef.set(
                        mapOf(
                            "title" to "Live Class: $cleanTitle".take(120),
                            "message" to "$cleanSubject session by $cleanHost on $cleanDate at $cleanTime. Open Meeting Zone to join via Google Meet.".take(500),
                            "audience" to "STUDENTS",
                            "active" to true,
                            "createdBy" to uid,
                            "createdAt" to FieldValue.serverTimestamp(),
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                }
            }

            Result.success(docRef.id)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateMeeting(
        meetingId: String,
        title: String,
        subject: String,
        description: String,
        meetUrl: String,
        scheduledDate: String,
        scheduledTime: String,
        hostName: String,
        notifyStudents: Boolean,
        published: Boolean = true
    ): Result<Unit> {
        val path = "meetings/$meetingId"
        return try {
            requireUserId()
            val cleanTitle = title.trim().take(150)
            val cleanSubject = subject.trim().take(80)
            val cleanDesc = description.trim().take(1000)
            val cleanUrl = meetUrl.trim().take(300)
            val cleanDate = scheduledDate.trim().take(20)
            val cleanTime = scheduledTime.trim().take(20)
            val cleanHost = hostName.trim().ifBlank { auth.currentUser?.displayName ?: "Faculty" }.take(80)

            require(cleanTitle.length >= 2) { "Meeting title must be at least 2 characters." }
            require(cleanSubject.length >= 2) { "Subject is required." }
            require(isValidGoogleMeetUrl(cleanUrl)) {
                "Please enter a valid Google Meet link (https://meet.google.com/...)."
            }
            require(cleanDate.length >= 8) { "Please enter a valid date (YYYY-MM-DD)." }
            require(cleanTime.length >= 3) { "Please enter a valid time (e.g. 04:00 PM)." }

            val epochMs = parseMeetingEpochMs(cleanDate, cleanTime)

            db.collection("meetings").document(meetingId).update(
                mapOf(
                    "title" to cleanTitle,
                    "subject" to cleanSubject,
                    "description" to cleanDesc,
                    "meetUrl" to cleanUrl,
                    "scheduledDate" to cleanDate,
                    "scheduledTime" to cleanTime,
                    "scheduledAtEpochMs" to epochMs,
                    "hostName" to cleanHost,
                    "notifyStudents" to notifyStudents,
                    "published" to published,
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

    suspend fun deleteMeeting(meetingId: String): Result<Unit> {
        val path = "meetings/$meetingId"
        return try {
            requireUserId()
            db.collection("meetings").document(meetingId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }
}
