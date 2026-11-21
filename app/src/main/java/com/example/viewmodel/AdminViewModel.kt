package com.example.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.AdminAuditLog
import com.example.data.model.AdminRecord
import com.example.data.model.AiUsageLog
import com.example.data.model.Announcement
import com.example.data.model.AppSettings
import com.example.data.model.CareerOpportunity
import com.example.data.model.CommunityPost
import com.example.data.model.FarmerQuery
import com.example.data.model.ProfessorDirectorySeed
import com.example.data.model.ProfessorProfile
import com.example.data.model.QuizQuestion
import com.example.data.model.StudyMaterial
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.data.repository.AcademicRepository
import com.example.data.repository.AgriAiRepository
import com.example.data.repository.AiConnectionTestResult
import com.example.data.repository.DoubtRepository
import com.example.data.repository.FarmerRepository
import com.example.data.repository.TelemetryRepository
import com.example.data.repository.UserRepository
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private const val ADMIN_TAG = "AdminViewModel"

sealed interface AiConnectionTestUiState {
    data object Idle : AiConnectionTestUiState
    data object Testing : AiConnectionTestUiState
    data class Connected(val result: AiConnectionTestResult) : AiConnectionTestUiState
    data class Failed(val message: String) : AiConnectionTestUiState
}

class AdminViewModel(
    private val userRepo: UserRepository,
    private val farmerRepo: FarmerRepository,
    private val academicRepo: AcademicRepository,
    private val telemetryRepo: TelemetryRepository? = null,
    private val doubtRepo: DoubtRepository? = null,
    private val aiRepo: AgriAiRepository? = null
) : ViewModel() {

    private fun <T> Flow<T>.toAdminState(label: String): StateFlow<UiState<T>> =
        this.map<T, UiState<T>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val root = firestoreError ?: error
                Log.w(ADMIN_TAG, "Admin observe error ($label)", root)
                emit(UiState.Error(root.localizedMessage ?: "Admin permission required for $label."))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000L),
                initialValue = UiState.Loading
            )

    val allUsers: StateFlow<UiState<List<UserProfile>>> =
        userRepo.observeAllUsersForAdmin().toAdminState("users")

    val allFarmerQueries: StateFlow<UiState<List<FarmerQuery>>> =
        farmerRepo.observeAllQueriesForAdmin().toAdminState("farmer queries")

    val allStudyMaterials: StateFlow<UiState<List<StudyMaterial>>> =
        academicRepo.observeStudyMaterials(includeUnpublishedForAdmin = true).toAdminState("study materials")

    val allQuizzes: StateFlow<UiState<List<QuizQuestion>>> =
        academicRepo.observeQuizzes(includeUnpublishedForAdmin = true).toAdminState("quizzes")

    val allCareers: StateFlow<UiState<List<CareerOpportunity>>> =
        academicRepo.observeCareers(includeUnpublishedForAdmin = true).toAdminState("careers")

    val allCommunityPosts: StateFlow<UiState<List<CommunityPost>>> =
        academicRepo.observeCommunityPosts(includeHiddenForAdmin = true).toAdminState("community posts")

    val allAnnouncements: StateFlow<UiState<List<Announcement>>> =
        academicRepo.observeAnnouncements(includeInactiveForAdmin = true).toAdminState("announcements")

    val adminRecords: StateFlow<UiState<List<AdminRecord>>> =
        userRepo.observeAdmins().toAdminState("admins")

    val auditLogs: StateFlow<UiState<List<AdminAuditLog>>> =
        (telemetryRepo?.observeAdminAuditLogs() ?: kotlinx.coroutines.flow.flowOf(emptyList()))
            .toAdminState("audit logs")

    val allProfessors: StateFlow<UiState<List<ProfessorProfile>>> =
        (doubtRepo?.observeProfessors(includeInactiveForAdmin = true)
            ?: kotlinx.coroutines.flow.flowOf(ProfessorDirectorySeed.officialFaculty))
            .toAdminState("professors")

    val allAiUsageLogs: StateFlow<UiState<List<AiUsageLog>>> =
        (telemetryRepo?.observeAiUsageLogs() ?: kotlinx.coroutines.flow.flowOf(emptyList()))
            .toAdminState("AI usage logs")

    private val _aiConnectionTestState = MutableStateFlow<AiConnectionTestUiState>(AiConnectionTestUiState.Idle)
    val aiConnectionTestState: StateFlow<AiConnectionTestUiState> = _aiConnectionTestState.asStateFlow()

    private val _pdfExtracting = MutableStateFlow(false)
    val pdfExtracting: StateFlow<Boolean> = _pdfExtracting.asStateFlow()

    private val _statusBanner = MutableStateFlow<String?>(null)
    val statusBanner: StateFlow<String?> = _statusBanner.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    fun clearBanner() {
        _statusBanner.value = null
    }

    fun publishStarterCurriculum() {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.publishStarterCurriculumAsAdmin()
            _busy.value = false
            _statusBanner.value = res.fold(
                onSuccess = {
                    telemetryRepo?.logActivityEvent("ADMIN", "MATERIAL_UPLOADED", "ADMIN", "Published ICAR starter curriculum bundle")
                    telemetryRepo?.logAdminAuditAction("CURRICULUM_PUBLISHED", "STUDY_MATERIAL", "starter_bundle", "Published starter ICAR curriculum, MCQs & careers")
                    "Starter ICAR B.Sc Agriculture curriculum, MCQs, careers & settings published!"
                },
                onFailure = { it.localizedMessage ?: "Failed to publish starter content." }
            )
        }
    }

    fun replyToFarmerQuery(queryId: String, status: String, reply: String) {
        viewModelScope.launch {
            _busy.value = true
            val res = farmerRepo.replyToQueryAsAdmin(queryId, status, reply)
            _busy.value = false
            _statusBanner.value = res.fold(
                onSuccess = {
                    telemetryRepo?.logAdminAuditAction("FARMER_QUERY_REPLIED", "FARMER_QUERY", queryId, "Set status=$status")
                    "Farmer query updated ($status)."
                },
                onFailure = { it.localizedMessage ?: "Failed to update query." }
            )
        }
    }

    fun addStudyMaterial(
        title: String,
        semester: Long,
        subject: String,
        category: String,
        summary: String,
        resourceUrl: String,
        contentText: String = "",
        verifiedForAi: Boolean = true,
        onDone: () -> Unit
    ) {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.addStudyMaterial(
                title = title,
                semester = semester,
                subject = subject,
                category = category,
                summary = summary,
                resourceUrl = resourceUrl,
                contentText = contentText,
                verifiedForAi = verifiedForAi
            )
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logActivityEvent("ADMIN", "MATERIAL_UPLOADED", "ADMIN", "Sem $semester $category: ${title.take(80)}")
                telemetryRepo?.logAdminAuditAction("STUDY_MATERIAL_ADDED", "STUDY_MATERIAL", "sem_$semester", "Added: ${title.take(120)}")
                _statusBanner.value = if (contentText.isNotBlank()) {
                    "Verified study material & AI Guru Knowledge Base notes published."
                } else {
                    "Study material published."
                }
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to publish material."
            }
        }
    }

    fun deleteStudyMaterial(id: String) {
        viewModelScope.launch {
            academicRepo.deleteStudyMaterial(id).onSuccess {
                telemetryRepo?.logAdminAuditAction("STUDY_MATERIAL_DELETED", "STUDY_MATERIAL", id, "Deleted study material $id")
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Delete failed."
            }
        }
    }

    fun addQuizQuestion(
        title: String,
        semester: Long,
        subject: String,
        questionText: String,
        options: List<String>,
        correctIndex: Long,
        explanation: String,
        onDone: () -> Unit
    ) {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.addQuizQuestion(title, semester, subject, questionText, options, correctIndex, explanation)
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logAdminAuditAction("MCQ_ADDED", "QUIZ", "sem_$semester", "Added MCQ: ${title.take(120)}")
                _statusBanner.value = "MCQ published."
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to add MCQ."
            }
        }
    }

    fun deleteQuizQuestion(id: String) {
        viewModelScope.launch {
            academicRepo.deleteQuizQuestion(id).onSuccess {
                telemetryRepo?.logAdminAuditAction("MCQ_DELETED", "QUIZ", id, "Deleted MCQ $id")
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Delete failed."
            }
        }
    }

    fun addCareer(
        title: String,
        organization: String,
        category: String,
        eligibility: String,
        deadline: String,
        description: String,
        applyUrl: String,
        onDone: () -> Unit
    ) {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.addCareer(title, organization, category, eligibility, deadline, description, applyUrl)
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logAdminAuditAction("CAREER_ADDED", "CAREER", category, "Added: ${title.take(120)}")
                _statusBanner.value = "Career alert published."
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to publish career."
            }
        }
    }

    fun deleteCareer(id: String) {
        viewModelScope.launch {
            academicRepo.deleteCareer(id).onSuccess {
                telemetryRepo?.logAdminAuditAction("CAREER_DELETED", "CAREER", id, "Deleted career listing $id")
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Delete failed."
            }
        }
    }

    fun addAnnouncement(title: String, message: String, audience: String, onDone: () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.addAnnouncement(title, message, audience)
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logAdminAuditAction("ANNOUNCEMENT_SENT", "ANNOUNCEMENT", audience, "Broadcast: ${title.take(120)}")
                _statusBanner.value = "Announcement broadcast live."
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to send announcement."
            }
        }
    }

    fun deleteAnnouncement(id: String) {
        viewModelScope.launch {
            academicRepo.deleteAnnouncement(id).onSuccess {
                telemetryRepo?.logAdminAuditAction("ANNOUNCEMENT_DELETED", "ANNOUNCEMENT", id, "Deleted announcement $id")
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Delete failed."
            }
        }
    }

    fun moderatePost(postId: String, newStatus: String) {
        viewModelScope.launch {
            academicRepo.moderateCommunityPost(postId, newStatus).onSuccess {
                telemetryRepo?.logAdminAuditAction("POST_MODERATED", "COMMUNITY_POST", postId, "Set post status=$newStatus")
                _statusBanner.value = "Post status updated to $newStatus."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Moderation failed."
            }
        }
    }

    fun saveSettings(
        whatsapp: String,
        whatsappGroupUrl: String,
        email: String,
        about: String,
        headline: String,
        currentSettings: AppSettings = AppSettings()
    ) {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.saveFullAppSettings(
                currentSettings.copy(
                    whatsappNumber = whatsapp,
                    whatsappGroupInviteUrl = whatsappGroupUrl,
                    supportEmail = email,
                    aboutText = about,
                    heroHeadline = headline
                )
            )
            _busy.value = false
            _statusBanner.value = res.fold(
                onSuccess = {
                    telemetryRepo?.logAdminAuditAction("SETTINGS_UPDATED", "APP_SETTINGS", "global", "Updated platform & WhatsApp Group settings")
                    "Platform & WhatsApp Group settings updated."
                },
                onFailure = { it.localizedMessage ?: "Failed to update settings." }
            )
        }
    }

    fun addStaffAdmin(targetUid: String, email: String, roleTitle: String, onDone: () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            val res = userRepo.addAdminStaff(targetUid, email, roleTitle)
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logAdminAuditAction("STAFF_GRANTED", "ADMIN_ROLE", targetUid.trim(), "Granted $roleTitle to $email")
                _statusBanner.value = "Admin staff role granted."
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to add admin staff."
            }
        }
    }

    fun removeStaffAdmin(targetUid: String) {
        viewModelScope.launch {
            userRepo.removeAdminStaff(targetUid).onSuccess {
                telemetryRepo?.logAdminAuditAction("STAFF_REVOKED", "ADMIN_ROLE", targetUid, "Revoked staff role for $targetUid")
                _statusBanner.value = "Admin staff removed."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to remove admin."
            }
        }
    }

    fun syncDefaultProfessors() {
        val repo = doubtRepo ?: return
        viewModelScope.launch {
            _busy.value = true
            val res = repo.syncDefaultProfessorsAsAdmin()
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logAdminAuditAction("FACULTY_SYNCED", "PROFESSOR_DIRECTORY", "official_9", "Synced all 9 official faculty profiles to Firestore")
                _statusBanner.value = "All 9 official faculty profiles synced to Firestore."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to sync faculty directory."
            }
        }
    }

    fun saveProfessorProfile(profile: ProfessorProfile, onDone: () -> Unit = {}) {
        val repo = doubtRepo ?: return
        viewModelScope.launch {
            _busy.value = true
            val res = repo.saveProfessorProfileAsAdmin(profile)
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logAdminAuditAction(
                    "PROFESSOR_SAVED",
                    "PROFESSOR_PROFILE",
                    profile.id.ifBlank { profile.name },
                    "Saved profile & permissions for ${profile.name}"
                )
                _statusBanner.value = "Professor profile & permissions saved."
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to save professor profile."
            }
        }
    }

    fun testAiGuruConnection(modelName: String) {
        val repo = aiRepo ?: AgriAiRepository(telemetryRepo)
        viewModelScope.launch {
            _aiConnectionTestState.value = AiConnectionTestUiState.Testing
            val res = repo.testLiveConnection(modelName)
            res.onSuccess { result ->
                _aiConnectionTestState.value = AiConnectionTestUiState.Connected(result)
                _statusBanner.value = "AI Guru Free Tier connected (${result.modelName}, ${result.latencyMs}ms)."
            }.onFailure { err ->
                val msg = err.localizedMessage ?: "Connection test failed."
                _aiConnectionTestState.value = AiConnectionTestUiState.Failed(msg)
                _statusBanner.value = msg
            }
        }
    }

    fun saveAiGuruSettings(
        currentSettings: AppSettings,
        enabled: Boolean,
        modelName: String,
        freeSearchEnabled: Boolean,
        dailyLimitPerUser: Long
    ) {
        val safeModel = AgriAiRepository.sanitizeFreeModelName(modelName)
        val safeLimit = dailyLimitPerUser.coerceIn(1L, 200L)
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.saveFullAppSettings(
                currentSettings.copy(
                    aiAssistantEnabled = enabled,
                    aiModelName = safeModel,
                    aiFreeSearchEnabled = freeSearchEnabled,
                    aiDailyLimitPerUser = safeLimit,
                    aiPaidServicesApproved = false // Strictly keep paid services disabled
                )
            )
            _busy.value = false
            res.onSuccess {
                telemetryRepo?.logAdminAuditAction(
                    action = "AI_GURU_SETTINGS_UPDATED",
                    targetType = "APP_SETTINGS",
                    targetId = "global",
                    summary = "AI Guru enabled=$enabled, model=$safeModel, freeSearch=$freeSearchEnabled, dailyLimit=$safeLimit"
                )
                _statusBanner.value = "AI Guru Free-Tier settings saved."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to save AI Guru settings."
            }
        }
    }

    fun extractPdfForKnowledgeBase(
        pdfBytes: ByteArray,
        fileName: String,
        modelName: String,
        onExtracted: (String) -> Unit
    ) {
        val repo = aiRepo ?: AgriAiRepository(telemetryRepo)
        viewModelScope.launch {
            _pdfExtracting.value = true
            val res = repo.extractStudyNotesFromPdf(pdfBytes, fileName, modelName)
            _pdfExtracting.value = false
            res.onSuccess { extracted ->
                _statusBanner.value = "Extracted ${extracted.length} characters from $fileName. Review & publish below."
                onExtracted(extracted)
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Unable to extract text from PDF."
            }
        }
    }
}
