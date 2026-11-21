package com.example.viewmodel

import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.DoubtChatThread
import com.example.data.model.DoubtMessage
import com.example.data.model.ProfessorDirectorySeed
import com.example.data.model.ProfessorProfile
import com.example.data.model.UiState
import com.example.data.model.buildDoubtChatId
import com.example.data.repository.DoubtRepository
import com.example.data.repository.FacultyIdentity
import com.example.data.repository.TelemetryRepository
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private const val DOUBT_TAG = "DoubtZoneVM"

data class ActiveChatSession(
    val chatId: String,
    val professor: ProfessorProfile,
    val studentId: String,
    val studentName: String,
    val studentSemester: Long,
    val viewingAsProfessor: Boolean
)

@OptIn(ExperimentalCoroutinesApi::class)
class DoubtZoneViewModel(
    val currentUserId: String,
    private val doubtRepo: DoubtRepository,
    private val telemetryRepo: TelemetryRepository
) : ViewModel() {

    private fun <T> Flow<T>.toDoubtState(label: String): StateFlow<UiState<T>> =
        this.map<T, UiState<T>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val root = firestoreError ?: error
                Log.w(DOUBT_TAG, "Doubt observe error ($label)", root)
                emit(UiState.Error(root.localizedMessage ?: "Unable to load $label."))
            }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000L), UiState.Loading)

    val professorsState: StateFlow<UiState<List<ProfessorProfile>>> =
        doubtRepo.observeProfessors(includeInactiveForAdmin = false)
            .map<List<ProfessorProfile>, UiState<List<ProfessorProfile>>> { UiState.Success(it) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000L), UiState.Success(ProfessorDirectorySeed.officialFaculty))

    val facultyIdentity: StateFlow<FacultyIdentity> =
        doubtRepo.observeCurrentFacultyIdentity(currentUserId)
            .stateIn(viewModelScope, SharingStarted.Lazily, FacultyIdentity())

    val studentThreadsState: StateFlow<UiState<List<DoubtChatThread>>> =
        doubtRepo.observeStudentThreads(currentUserId).toDoubtState("student conversations")

    val professorThreadsState: StateFlow<UiState<List<DoubtChatThread>>> =
        facultyIdentity
            .flatMapLatest { identity ->
                if (identity.isAuthorizedProfessor) {
                    doubtRepo.observeProfessorAssignedThreads(identity)
                        .map<List<DoubtChatThread>, UiState<List<DoubtChatThread>>> { UiState.Success(it) }
                        .catch { error ->
                            val firestoreError = generateSequence(error) { it.cause }
                                .filterIsInstance<FirebaseFirestoreException>()
                                .firstOrNull()
                            if (firestoreError == null && error is CancellationException) throw error
                            emit(UiState.Error((firestoreError ?: error).localizedMessage ?: "Unable to load assigned doubts."))
                        }
                } else {
                    flowOf(UiState.Success(emptyList()))
                }
            }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000L), UiState.Success(emptyList()))

    /**
     * Total unread badge count across the user's private student conversations
     * AND (if signed in as an authorized professor) their assigned student doubts inbox.
     */
    val totalUnreadCount: StateFlow<Int> =
        combine(studentThreadsState, professorThreadsState) { stuState, profState ->
            val stuUnread = (stuState as? UiState.Success)?.data?.sumOf { it.unreadForStudent } ?: 0L
            val profUnread = (profState as? UiState.Success)?.data?.sumOf { it.unreadForProfessor } ?: 0L
            (stuUnread + profUnread).toInt()
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000L), 0)

    private val _activeSession = MutableStateFlow<ActiveChatSession?>(null)
    val activeSession: StateFlow<ActiveChatSession?> = _activeSession.asStateFlow()

    val activeMessagesState: StateFlow<UiState<List<DoubtMessage>>> =
        combine(_activeSession, facultyIdentity) { session, identity -> session to identity }
            .flatMapLatest { (session, identity) ->
                if (session == null) {
                    flowOf(UiState.Success(emptyList()))
                } else {
                    doubtRepo.observeMessages(
                        chatId = session.chatId,
                        asProfessor = session.viewingAsProfessor,
                        identity = identity,
                        studentId = session.studentId
                    )
                        .map<List<DoubtMessage>, UiState<List<DoubtMessage>>> { UiState.Success(it) }
                        .catch { error ->
                            val firestoreError = generateSequence(error) { it.cause }
                                .filterIsInstance<FirebaseFirestoreException>()
                                .firstOrNull()
                            if (firestoreError == null && error is CancellationException) throw error
                            val root = firestoreError ?: error
                            // If a thread document hasn't been created yet (first-time Ask Doubt), show empty list cleanly
                            if (root is FirebaseFirestoreException && root.code == FirebaseFirestoreException.Code.PERMISSION_DENIED) {
                                emit(UiState.Success(emptyList()))
                            } else {
                                emit(UiState.Error(root.localizedMessage ?: "Unable to load messages."))
                            }
                        }
                }
            }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000L), UiState.Success(emptyList()))

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    private val _sending = MutableStateFlow(false)
    val sending: StateFlow<Boolean> = _sending.asStateFlow()

    fun clearMessage() {
        _statusMessage.value = null
    }

    fun openChatWithProfessor(
        professor: ProfessorProfile,
        studentName: String,
        studentSemester: Long
    ) {
        val chatId = buildDoubtChatId(professor.id, currentUserId)
        _activeSession.value = ActiveChatSession(
            chatId = chatId,
            professor = professor,
            studentId = currentUserId,
            studentName = studentName.ifBlank { "Student" },
            studentSemester = studentSemester,
            viewingAsProfessor = false
        )
    }

    fun openExistingThread(thread: DoubtChatThread, asProfessor: Boolean) {
        val profList = (professorsState.value as? UiState.Success)?.data ?: ProfessorDirectorySeed.officialFaculty
        val matchedProf = profList.firstOrNull { it.id == thread.professorId }
            ?: ProfessorProfile(
                id = thread.professorId,
                name = thread.professorName,
                email = thread.professorEmail,
                authorizedUid = thread.professorUid
            )
        _activeSession.value = ActiveChatSession(
            chatId = thread.id.ifBlank { buildDoubtChatId(thread.professorId, thread.studentId) },
            professor = matchedProf,
            studentId = thread.studentId,
            studentName = thread.studentName,
            studentSemester = thread.studentSemester,
            viewingAsProfessor = asProfessor
        )
    }

    fun closeActiveChat() {
        _activeSession.value = null
    }

    fun sendDoubtMessage(
        text: String,
        imageBitmap: Bitmap?,
        senderDisplayName: String,
        onSuccess: () -> Unit = {}
    ) {
        val session = _activeSession.value ?: return
        viewModelScope.launch {
            _sending.value = true
            val senderRole = if (session.viewingAsProfessor) "PROFESSOR" else "STUDENT"
            val senderName = if (session.viewingAsProfessor) {
                facultyIdentity.value.professorName.ifBlank { session.professor.name }
            } else {
                senderDisplayName.ifBlank { session.studentName }
            }
            val res = doubtRepo.sendMessage(
                professor = session.professor,
                studentId = session.studentId,
                studentName = session.studentName,
                studentSemester = session.studentSemester,
                senderRole = senderRole,
                senderName = senderName,
                text = text,
                imageBitmap = imageBitmap
            )
            _sending.value = false
            res.onSuccess {
                if (!session.viewingAsProfessor) {
                    // Log non-sensitive activity count ONLY (never log private message text!)
                    telemetryRepo.logActivityEvent("STUDENT", "DOUBT_ASKED", "DOUBT_ZONE", "Academic doubt sent to ${session.professor.name}")
                }
                onSuccess()
            }.onFailure { err ->
                _statusMessage.value = err.localizedMessage ?: "Failed to send message."
            }
        }
    }

    fun markActiveConversationRead(messages: List<DoubtMessage>) {
        val session = _activeSession.value ?: return
        val threads = if (session.viewingAsProfessor) {
            (professorThreadsState.value as? UiState.Success)?.data.orEmpty()
        } else {
            (studentThreadsState.value as? UiState.Success)?.data.orEmpty()
        }
        val thread = threads.firstOrNull { it.id == session.chatId } ?: return
        viewModelScope.launch {
            doubtRepo.markConversationRead(thread, messages, session.viewingAsProfessor)
        }
    }

    fun deleteOwnMessage(messageId: String) {
        val session = _activeSession.value ?: return
        viewModelScope.launch {
            doubtRepo.deleteOwnMessage(session.chatId, messageId).onFailure { err ->
                _statusMessage.value = err.localizedMessage ?: "Could not delete message."
            }
        }
    }
}
