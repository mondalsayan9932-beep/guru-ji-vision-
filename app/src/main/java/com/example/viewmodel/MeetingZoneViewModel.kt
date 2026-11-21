package com.example.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.MeetingSession
import com.example.data.model.UiState
import com.example.data.repository.DoubtRepository
import com.example.data.repository.FacultyIdentity
import com.example.data.repository.MeetingRepository
import com.example.data.repository.TelemetryRepository
import com.example.data.repository.UserRepository
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private const val MEETING_TAG = "MeetingZoneVM"

@OptIn(ExperimentalCoroutinesApi::class)
class MeetingZoneViewModel(
    val currentUserId: String,
    private val meetingRepo: MeetingRepository,
    private val doubtRepo: DoubtRepository,
    private val userRepo: UserRepository,
    private val telemetryRepo: TelemetryRepository
) : ViewModel() {

    val facultyIdentity: StateFlow<FacultyIdentity> =
        doubtRepo.observeCurrentFacultyIdentity(currentUserId)
            .stateIn(viewModelScope, SharingStarted.Lazily, FacultyIdentity())

    val isFounder: StateFlow<Boolean> =
        userRepo.observeIsFounder(currentUserId)
            .stateIn(viewModelScope, SharingStarted.Lazily, userRepo.isSuperAdminCurrentUser())

    val canHostMeetings: StateFlow<Boolean> =
        combine(isFounder, facultyIdentity) { founder, fac ->
            founder || (fac.isAuthorizedProfessor && fac.canHostMeetings)
        }.stateIn(viewModelScope, SharingStarted.Lazily, userRepo.isSuperAdminCurrentUser())

    val meetingsState: StateFlow<UiState<List<MeetingSession>>> =
        canHostMeetings
            .flatMapLatest { isHost ->
                meetingRepo.observeMeetings(includeUnpublishedForHost = isHost)
                    .map<List<MeetingSession>, UiState<List<MeetingSession>>> { UiState.Success(it) }
                    .catch { error ->
                        val firestoreError = generateSequence(error) { it.cause }
                            .filterIsInstance<FirebaseFirestoreException>()
                            .firstOrNull()
                        if (firestoreError == null && error is CancellationException) throw error
                        val root = firestoreError ?: error
                        Log.w(MEETING_TAG, "Meetings observe error", root)
                        emit(UiState.Error(root.localizedMessage ?: "Unable to load Meeting Zone sessions."))
                    }
            }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000L), UiState.Loading)

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    fun clearMessage() {
        _statusMessage.value = null
    }

    fun createMeeting(
        title: String,
        subject: String,
        description: String,
        meetUrl: String,
        scheduledDate: String,
        scheduledTime: String,
        hostName: String,
        notifyStudents: Boolean,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _busy.value = true
            val res = meetingRepo.createMeeting(
                title = title,
                subject = subject,
                description = description,
                meetUrl = meetUrl,
                scheduledDate = scheduledDate,
                scheduledTime = scheduledTime,
                hostName = hostName,
                notifyStudents = notifyStudents
            )
            _busy.value = false
            res.onSuccess { meetingId ->
                val role = if (isFounder.value) "ADMIN" else "PROFESSOR"
                telemetryRepo.logActivityEvent(role, "MEETING_CREATED", "MEETING_ZONE", "Scheduled: ${title.trim().take(80)}")
                if (isFounder.value) {
                    telemetryRepo.logAdminAuditAction("MEETING_CREATED", "MEETING", meetingId, "Scheduled $title ($scheduledDate $scheduledTime)")
                }
                _statusMessage.value = if (notifyStudents) {
                    "Meeting published & students notified!"
                } else {
                    "Meeting published to Meeting Zone."
                }
                onSuccess()
            }.onFailure { err ->
                _statusMessage.value = err.localizedMessage ?: "Unable to publish meeting."
            }
        }
    }

    fun updateMeeting(
        meetingId: String,
        title: String,
        subject: String,
        description: String,
        meetUrl: String,
        scheduledDate: String,
        scheduledTime: String,
        hostName: String,
        notifyStudents: Boolean,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _busy.value = true
            val res = meetingRepo.updateMeeting(
                meetingId = meetingId,
                title = title,
                subject = subject,
                description = description,
                meetUrl = meetUrl,
                scheduledDate = scheduledDate,
                scheduledTime = scheduledTime,
                hostName = hostName,
                notifyStudents = notifyStudents
            )
            _busy.value = false
            res.onSuccess {
                if (isFounder.value) {
                    telemetryRepo.logAdminAuditAction("MEETING_UPDATED", "MEETING", meetingId, "Updated $title")
                }
                _statusMessage.value = "Meeting updated successfully."
                onSuccess()
            }.onFailure { err ->
                _statusMessage.value = err.localizedMessage ?: "Unable to update meeting."
            }
        }
    }

    fun deleteMeeting(meetingId: String, title: String) {
        viewModelScope.launch {
            _busy.value = true
            val res = meetingRepo.deleteMeeting(meetingId)
            _busy.value = false
            res.onSuccess {
                if (isFounder.value) {
                    telemetryRepo.logAdminAuditAction("MEETING_DELETED", "MEETING", meetingId, "Deleted $title")
                }
                _statusMessage.value = "Meeting deleted."
            }.onFailure { err ->
                _statusMessage.value = err.localizedMessage ?: "Unable to delete meeting."
            }
        }
    }

    fun logMeetingJoined(meeting: MeetingSession, userRole: String) {
        viewModelScope.launch {
            val safeRole = when {
                isFounder.value -> "ADMIN"
                facultyIdentity.value.isAuthorizedProfessor -> "PROFESSOR"
                userRole == "FARMER" -> "FARMER"
                else -> "STUDENT"
            }
            telemetryRepo.logActivityEvent(safeRole, "MEETING_JOINED", "MEETING_ZONE", "Joined ${meeting.title.take(80)}")
        }
    }
}
