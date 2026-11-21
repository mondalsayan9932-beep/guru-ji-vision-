package com.example.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.core.OwnerReportSnapshot
import com.example.core.ReportTimeframe
import com.example.core.buildOwnerReportSnapshot
import com.example.data.model.ActivityEvent
import com.example.data.model.AdminAuditLog
import com.example.data.model.AdminRecord
import com.example.data.model.AiUsageLog
import com.example.data.model.Announcement
import com.example.data.model.AppSettings
import com.example.data.model.CareerOpportunity
import com.example.data.model.CommunityPost
import com.example.data.model.ContentReport
import com.example.data.model.ErrorLog
import com.example.data.model.ExamStat
import com.example.data.model.FarmerQuery
import com.example.data.model.QuizQuestion
import com.example.data.model.StudyMaterial
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.data.repository.AcademicRepository
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
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private const val OWNER_TAG = "OwnerControlVM"

/**
 * Strictly instantiated ONLY for the verified Platform Owner (Super Admin).
 * Aggregates real connected Firestore telemetry across platform collections.
 * NEVER accesses private student Money Manager subcollections (/transactions or /budgets).
 */
class OwnerControlViewModel(
    private val userRepo: UserRepository,
    private val farmerRepo: FarmerRepository,
    private val academicRepo: AcademicRepository,
    private val telemetryRepo: TelemetryRepository
) : ViewModel() {

    private fun <T> Flow<T>.toOwnerState(label: String): StateFlow<UiState<T>> =
        this.map<T, UiState<T>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val root = firestoreError ?: error
                Log.w(OWNER_TAG, "Owner observe error ($label)", root)
                emit(UiState.Error(root.localizedMessage ?: "Owner permission required for $label."))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000L),
                initialValue = UiState.Loading
            )

    val allUsers: StateFlow<UiState<List<UserProfile>>> =
        userRepo.observeAllUsersForAdmin().toOwnerState("users")

    val allFarmerQueries: StateFlow<UiState<List<FarmerQuery>>> =
        farmerRepo.observeAllQueriesForAdmin().toOwnerState("farmer queries")

    val allStudyMaterials: StateFlow<UiState<List<StudyMaterial>>> =
        academicRepo.observeStudyMaterials(includeUnpublishedForAdmin = true).toOwnerState("study materials")

    val allQuizzes: StateFlow<UiState<List<QuizQuestion>>> =
        academicRepo.observeQuizzes(includeUnpublishedForAdmin = true).toOwnerState("quizzes")

    val allCareers: StateFlow<UiState<List<CareerOpportunity>>> =
        academicRepo.observeCareers(includeUnpublishedForAdmin = true).toOwnerState("careers")

    val allCommunityPosts: StateFlow<UiState<List<CommunityPost>>> =
        academicRepo.observeCommunityPosts(includeHiddenForAdmin = true).toOwnerState("community posts")

    val allAnnouncements: StateFlow<UiState<List<Announcement>>> =
        academicRepo.observeAnnouncements(includeInactiveForAdmin = true).toOwnerState("announcements")

    val adminRecords: StateFlow<UiState<List<AdminRecord>>> =
        userRepo.observeAdmins().toOwnerState("admins")

    val activityEvents: StateFlow<UiState<List<ActivityEvent>>> =
        telemetryRepo.observeActivityEvents().toOwnerState("activity events")

    val examStats: StateFlow<UiState<List<ExamStat>>> =
        telemetryRepo.observeExamStats().toOwnerState("exam stats")

    val aiUsageLogs: StateFlow<UiState<List<AiUsageLog>>> =
        telemetryRepo.observeAiUsageLogs().toOwnerState("AI usage logs")

    val errorLogs: StateFlow<UiState<List<ErrorLog>>> =
        telemetryRepo.observeErrorLogs().toOwnerState("error logs")

    val contentReports: StateFlow<UiState<List<ContentReport>>> =
        telemetryRepo.observeContentReports().toOwnerState("content reports")

    val auditLogs: StateFlow<UiState<List<AdminAuditLog>>> =
        telemetryRepo.observeAdminAuditLogs().toOwnerState("audit logs")

    private val _selectedTimeframe = MutableStateFlow(ReportTimeframe.WEEKLY_7D)
    val selectedTimeframe: StateFlow<ReportTimeframe> = _selectedTimeframe.asStateFlow()

    private val _statusBanner = MutableStateFlow<String?>(null)
    val statusBanner: StateFlow<String?> = _statusBanner.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    fun setTimeframe(timeframe: ReportTimeframe) {
        _selectedTimeframe.value = timeframe
    }

    fun showBanner(message: String) {
        _statusBanner.value = message
    }

    fun clearBanner() {
        _statusBanner.value = null
    }

    // Reactive report snapshot built strictly from live Firestore data
    private val coreDataFlow = combine(
        allUsers,
        activityEvents,
        allFarmerQueries,
        allStudyMaterials,
        allQuizzes
    ) { u, act, q, m, quiz ->
        listOf(u, act, q, m, quiz)
    }

    private val telemetryDataFlow = combine(
        examStats,
        aiUsageLogs,
        errorLogs,
        contentReports,
        allCommunityPosts
    ) { ex, ai, err, rep, posts ->
        listOf(ex, ai, err, rep, posts)
    }

    private val secondaryDataFlow = combine(
        allCareers,
        allAnnouncements,
        adminRecords,
        selectedTimeframe
    ) { c, ann, adm, tf ->
        listOf(c, ann, adm, tf)
    }

    @Suppress("UNCHECKED_CAST")
    val reportSnapshot: StateFlow<OwnerReportSnapshot> = combine(
        coreDataFlow,
        telemetryDataFlow,
        secondaryDataFlow
    ) { core, telem, sec ->
        val users = (core[0] as? UiState.Success<List<UserProfile>>)?.data.orEmpty()
        val activities = (core[1] as? UiState.Success<List<ActivityEvent>>)?.data.orEmpty()
        val queries = (core[2] as? UiState.Success<List<FarmerQuery>>)?.data.orEmpty()
        val materials = (core[3] as? UiState.Success<List<StudyMaterial>>)?.data.orEmpty()
        val quizzes = (core[4] as? UiState.Success<List<QuizQuestion>>)?.data.orEmpty()

        val exams = (telem[0] as? UiState.Success<List<ExamStat>>)?.data.orEmpty()
        val ai = (telem[1] as? UiState.Success<List<AiUsageLog>>)?.data.orEmpty()
        val errors = (telem[2] as? UiState.Success<List<ErrorLog>>)?.data.orEmpty()
        val reports = (telem[3] as? UiState.Success<List<ContentReport>>)?.data.orEmpty()
        val posts = (telem[4] as? UiState.Success<List<CommunityPost>>)?.data.orEmpty()

        val careers = (sec[0] as? UiState.Success<List<CareerOpportunity>>)?.data.orEmpty()
        val announcements = (sec[1] as? UiState.Success<List<Announcement>>)?.data.orEmpty()
        val admins = (sec[2] as? UiState.Success<List<AdminRecord>>)?.data.orEmpty()
        val timeframe = sec[3] as ReportTimeframe

        buildOwnerReportSnapshot(
            timeframe = timeframe,
            users = users,
            activities = activities,
            queries = queries,
            materials = materials,
            quizzes = quizzes,
            examStats = exams,
            aiLogs = ai,
            errorLogs = errors,
            reports = reports,
            careers = careers,
            posts = posts,
            announcements = announcements,
            admins = admins
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000L),
        initialValue = buildOwnerReportSnapshot(
            timeframe = ReportTimeframe.WEEKLY_7D,
            users = emptyList(),
            activities = emptyList(),
            queries = emptyList(),
            materials = emptyList(),
            quizzes = emptyList(),
            examStats = emptyList(),
            aiLogs = emptyList(),
            errorLogs = emptyList(),
            reports = emptyList(),
            careers = emptyList(),
            posts = emptyList(),
            announcements = emptyList(),
            admins = emptyList()
        )
    )

    // --- OWNER CONTROLS ---

    fun updateAppSettings(updated: AppSettings, successMsg: String = "Platform configuration saved.") {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.saveFullAppSettings(updated)
            _busy.value = false
            _statusBanner.value = res.fold(
                onSuccess = {
                    telemetryRepo.logAdminAuditAction("PLATFORM_CONFIG_UPDATED", "APP_SETTINGS", "global", successMsg)
                    successMsg
                },
                onFailure = { it.localizedMessage ?: "Failed to update settings." }
            )
        }
    }

    fun resolveErrorLog(errorId: String, resolved: Boolean) {
        viewModelScope.launch {
            telemetryRepo.resolveErrorLog(errorId, resolved).onSuccess {
                telemetryRepo.logAdminAuditAction("ERROR_ALERT_UPDATED", "ERROR_LOG", errorId, "Set resolved=$resolved")
                _statusBanner.value = if (resolved) "System alert marked resolved." else "Alert reopened."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Could not update alert."
            }
        }
    }

    fun deleteErrorLog(errorId: String) {
        viewModelScope.launch {
            telemetryRepo.deleteErrorLog(errorId).onSuccess {
                telemetryRepo.logAdminAuditAction("ERROR_ALERT_DELETED", "ERROR_LOG", errorId, "Removed error alert $errorId")
                _statusBanner.value = "Error log entry removed."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Could not delete log."
            }
        }
    }

    fun dismissContentReport(reportId: String) {
        viewModelScope.launch {
            _busy.value = true
            val res = telemetryRepo.resolveContentReport(reportId, "DISMISSED")
            _busy.value = false
            _statusBanner.value = res.fold(
                onSuccess = {
                    telemetryRepo.logAdminAuditAction("REPORT_DISMISSED", "CONTENT_REPORT", reportId, "Dismissed content report")
                    "Content report dismissed."
                },
                onFailure = { it.localizedMessage ?: "Failed to dismiss report." }
            )
        }
    }

    fun hidePostAndResolveReport(report: ContentReport) {
        viewModelScope.launch {
            _busy.value = true
            val modRes = academicRepo.moderateCommunityPost(report.targetId, "HIDDEN")
            val repRes = telemetryRepo.resolveContentReport(report.id, "ACTION_TAKEN")
            _busy.value = false
            if (modRes.isSuccess && repRes.isSuccess) {
                telemetryRepo.logAdminAuditAction("POST_HIDDEN_VIA_REPORT", "COMMUNITY_POST", report.targetId, "Hidden reported post: ${report.targetTitle.take(100)}")
                _statusBanner.value = "Reported post hidden and case closed."
            } else {
                _statusBanner.value = modRes.exceptionOrNull()?.localizedMessage
                    ?: repRes.exceptionOrNull()?.localizedMessage
                    ?: "Partial moderation update."
            }
        }
    }

    fun replyToFarmerQuery(queryId: String, status: String, reply: String) {
        viewModelScope.launch {
            _busy.value = true
            val res = farmerRepo.replyToQueryAsAdmin(queryId, status, reply)
            _busy.value = false
            _statusBanner.value = res.fold(
                onSuccess = {
                    telemetryRepo.logAdminAuditAction("FARMER_QUERY_UPDATED", "FARMER_QUERY", queryId, "Updated farmer query status=$status")
                    "Farmer query updated ($status)."
                },
                onFailure = { it.localizedMessage ?: "Failed to update farmer query." }
            )
        }
    }

    fun broadcastAnnouncement(title: String, message: String, audience: String, onDone: () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            val res = academicRepo.addAnnouncement(title, message, audience)
            _busy.value = false
            res.onSuccess {
                telemetryRepo.logAdminAuditAction("ANNOUNCEMENT_BROADCAST", "ANNOUNCEMENT", audience, "Broadcast: ${title.take(120)}")
                _statusBanner.value = "Announcement broadcast live to $audience."
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to broadcast announcement."
            }
        }
    }

    fun deleteAnnouncement(id: String) {
        viewModelScope.launch {
            academicRepo.deleteAnnouncement(id).onSuccess {
                telemetryRepo.logAdminAuditAction("ANNOUNCEMENT_DELETED", "ANNOUNCEMENT", id, "Removed announcement $id")
                _statusBanner.value = "Announcement removed."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Delete failed."
            }
        }
    }

    fun grantStaffRole(targetUid: String, email: String, roleTitle: String, onDone: () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            val res = userRepo.addAdminStaff(targetUid, email, roleTitle)
            _busy.value = false
            res.onSuccess {
                telemetryRepo.logAdminAuditAction("STAFF_ROLE_GRANTED", "ADMIN_ROLE", targetUid.trim(), "Granted $roleTitle to $email")
                _statusBanner.value = "Staff role ($roleTitle) granted."
                onDone()
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to grant staff role."
            }
        }
    }

    fun revokeStaffRole(targetUid: String) {
        viewModelScope.launch {
            userRepo.removeAdminStaff(targetUid).onSuccess {
                telemetryRepo.logAdminAuditAction("STAFF_ROLE_REVOKED", "ADMIN_ROLE", targetUid, "Revoked staff role for $targetUid")
                _statusBanner.value = "Staff admin access revoked."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Failed to revoke access."
            }
        }
    }

    fun logDiagnosticTestAlert() {
        viewModelScope.launch {
            telemetryRepo.logError(
                source = "SYSTEM",
                severity = "INFO",
                module = "OWNER_HEALTH_CHECK",
                message = "Owner initiated live telemetry write verification ping."
            ).onSuccess {
                _statusBanner.value = "Live telemetry write check logged."
            }.onFailure {
                _statusBanner.value = it.localizedMessage ?: "Telemetry ping failed."
            }
        }
    }
}
