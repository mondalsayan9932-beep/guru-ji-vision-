package com.example.viewmodel

import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.core.AppLanguage
import com.example.core.SessionPersistenceStore
import com.example.data.model.Announcement
import com.example.data.model.AppSettings
import com.example.data.model.CareerOpportunity
import com.example.data.model.CommunityPost
import com.example.data.model.FarmerQuery
import com.example.data.model.FinancialGoal
import com.example.data.model.MoneyTransaction
import com.example.data.model.QuizAttempt
import com.example.data.model.QuizQuestion
import com.example.data.model.StudyMaterial
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.data.repository.AcademicRepository
import com.example.data.repository.AgriAiRepository
import com.example.data.repository.FarmerRepository
import com.example.data.repository.MoneyRepository
import com.example.data.repository.TelemetryRepository
import com.example.data.repository.UserRepository
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.retryWhen
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private const val ECO_TAG = "EcosystemViewModel"
private const val STOP_TIMEOUT_MS = 5_000L

class EcosystemViewModel(
    val currentUserId: String,
    private val userRepo: UserRepository,
    private val moneyRepo: MoneyRepository,
    private val farmerRepo: FarmerRepository,
    private val academicRepo: AcademicRepository,
    private val aiRepo: AgriAiRepository,
    private val telemetryRepo: TelemetryRepository,
    private val sessionStore: SessionPersistenceStore? = null
) : ViewModel() {

    val isSuperAdmin: Boolean = userRepo.isSuperAdminCurrentUser()

    private var sessionLogged = false

    private fun currentRole(): String {
        if (isSuperAdmin) return "ADMIN"
        val profile = (profileState.value as? UiState.Success)?.data
        return if (profile?.role == "FARMER") "FARMER" else "STUDENT"
    }

    private fun isTransientFirestoreFailure(error: Throwable): Boolean {
        val fsError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull() ?: return false
        return fsError.code in setOf(
            FirebaseFirestoreException.Code.UNAVAILABLE,
            FirebaseFirestoreException.Code.DEADLINE_EXCEEDED,
            FirebaseFirestoreException.Code.ABORTED,
            FirebaseFirestoreException.Code.INTERNAL
        )
    }

    private fun <T> Flow<T>.toUiState(
        label: String,
        started: SharingStarted = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MS)
    ): StateFlow<UiState<T>> =
        this.retryWhen { error, attempt ->
                if (isTransientFirestoreFailure(error) && attempt < 4) {
                    delay(((attempt + 1L) * 1_500L).coerceAtMost(6_000L))
                    true
                } else {
                    false
                }
            }
            .map<T, UiState<T>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val root = firestoreError ?: error
                Log.w(ECO_TAG, "Error observing $label", root)
                emit(UiState.Error(root.localizedMessage ?: "Failed to load $label."))
            }
            .stateIn(
                scope = viewModelScope,
                started = started,
                initialValue = UiState.Loading
            )

    /**
     * Kept alive with SharingStarted.Lazily for the UID-scoped lifetime of this ViewModel
     * (torn down cleanly by key(uid) on sign-out) so backgrounding the app for >5s NEVER
     * resets profileState to Loading or unmounts the active navigation screen.
     */
    val profileState: StateFlow<UiState<UserProfile?>> = flow<UserProfile?> {
        val cached = sessionStore?.getCachedProfileForUser(currentUserId)
        if (cached != null) {
            emit(cached)
        }
        emitAll(
            userRepo.observeProfile(currentUserId).onEach { liveProfile ->
                if (liveProfile != null) {
                    sessionStore?.cacheUserProfile(liveProfile)
                }
            }
        )
    }.toUiState("profile", started = SharingStarted.Lazily)

    val isFounder: StateFlow<Boolean> =
        userRepo.observeIsFounder(currentUserId)
            .catch { error ->
                if (error is CancellationException) throw error
                emit(userRepo.isSuperAdminCurrentUser())
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.Lazily,
                initialValue = userRepo.isSuperAdminCurrentUser()
            )

    val isAdmin: StateFlow<Boolean> =
        userRepo.observeIsAdmin(currentUserId)
            .catch { error ->
                if (error is CancellationException) throw error
                emit(false)
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.Lazily,
                initialValue = userRepo.isSuperAdminCurrentUser()
            )

    val announcementsState: StateFlow<UiState<List<Announcement>>> =
        academicRepo.observeAnnouncements(false).toUiState("announcements")

    val appSettings: StateFlow<AppSettings> =
        academicRepo.observeAppSettings()
            .catch { error ->
                if (error is CancellationException) throw error
                emit(AppSettings())
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.Lazily,
                initialValue = AppSettings()
            )

    val studyMaterialsState: StateFlow<UiState<List<StudyMaterial>>> =
        academicRepo.observeStudyMaterials(false).toUiState("study materials")

    val quizzesState: StateFlow<UiState<List<QuizQuestion>>> =
        academicRepo.observeQuizzes(false).toUiState("quizzes")

    val myQuizAttemptsState: StateFlow<UiState<List<QuizAttempt>>> =
        academicRepo.observeMyQuizAttempts(currentUserId).toUiState("quiz attempts")

    val careersState: StateFlow<UiState<List<CareerOpportunity>>> =
        academicRepo.observeCareers(false).toUiState("careers")

    val communityPostsState: StateFlow<UiState<List<CommunityPost>>> =
        academicRepo.observeCommunityPosts(false).toUiState("community posts")

    val myFarmerQueriesState: StateFlow<UiState<List<FarmerQuery>>> =
        farmerRepo.observeMyQueries(currentUserId).toUiState("farmer queries")

    val transactionsState: StateFlow<UiState<List<MoneyTransaction>>> =
        moneyRepo.observeTransactions(currentUserId).toUiState("transactions")

    val goalsState: StateFlow<UiState<List<FinancialGoal>>> =
        moneyRepo.observeGoals(currentUserId).toUiState("financial goals")

    private val _actionMessage = MutableStateFlow<String?>(null)
    val actionMessage: StateFlow<String?> = _actionMessage.asStateFlow()

    private val _actionBusy = MutableStateFlow(false)
    val actionBusy: StateFlow<Boolean> = _actionBusy.asStateFlow()

    fun clearMessage() {
        _actionMessage.value = null
    }

    fun recordSessionHeartbeatIfNeeded(profileRole: String?) {
        if (sessionLogged) return
        sessionLogged = true
        viewModelScope.launch {
            telemetryRepo.touchUserPresence()
            val role = when {
                isSuperAdmin -> "ADMIN"
                profileRole == "FARMER" -> "FARMER"
                else -> "STUDENT"
            }
            telemetryRepo.logActivityEvent(
                userRole = role,
                eventType = "APP_SESSION",
                module = if (role == "FARMER") "FARMER" else "STUDENT",
                detail = "Active session started"
            )
        }
    }

    fun submitContentReport(
        post: CommunityPost,
        reason: String,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            val reporterName = (profileState.value as? UiState.Success)?.data?.displayName ?: "Member"
            val res = telemetryRepo.submitContentReport(
                reporterName = reporterName,
                targetId = post.id,
                targetTitle = post.title,
                reason = reason
            )
            _actionBusy.value = false
            res.onSuccess {
                _actionMessage.value = "Report submitted to Guru Ji Vision moderation team."
                onSuccess()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to submit report."
            }
        }
    }

    fun saveProfile(
        displayName: String,
        role: String,
        institutionOrVillage: String,
        district: String,
        semester: Long,
        language: String,
        isExisting: Boolean,
        onDone: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            val result = userRepo.createOrUpdateProfile(
                displayName = displayName,
                role = role,
                institutionOrVillage = institutionOrVillage,
                district = district,
                semester = semester,
                language = language,
                isExisting = isExisting
            )
            _actionBusy.value = false
            result.onSuccess {
                _actionMessage.value = "Profile saved successfully."
                onDone()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to save profile."
            }
        }
    }

    fun addMoneyTransaction(
        title: String,
        amount: Double,
        type: String,
        category: String,
        note: String,
        dateLabel: String,
        sharedWith: String?,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            val res = moneyRepo.addTransaction(title, amount, type, category, note, dateLabel, sharedWith)
            _actionBusy.value = false
            res.onSuccess {
                _actionMessage.value = "Transaction recorded privately."
                onSuccess()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to record transaction."
            }
        }
    }

    fun updateMoneyTransaction(
        transactionId: String,
        title: String,
        amount: Double,
        type: String,
        category: String,
        note: String,
        dateLabel: String,
        sharedWith: String?,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            val res = moneyRepo.updateTransaction(
                transactionId = transactionId,
                title = title,
                amount = amount,
                type = type,
                category = category,
                note = note,
                dateLabel = dateLabel,
                sharedWith = sharedWith
            )
            _actionBusy.value = false
            res.onSuccess {
                _actionMessage.value = "Personal record updated privately."
                onSuccess()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to update record."
            }
        }
    }

    fun deleteMoneyTransaction(transactionId: String) {
        viewModelScope.launch {
            moneyRepo.deleteTransaction(transactionId).onSuccess {
                _actionMessage.value = "Personal record deleted."
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Unable to delete transaction."
            }
        }
    }

    fun addFinancialGoal(
        name: String,
        kind: String,
        targetAmount: Double,
        savedAmount: Double,
        monthKey: String,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            val res = moneyRepo.addGoal(name, kind, targetAmount, savedAmount, monthKey)
            _actionBusy.value = false
            res.onSuccess {
                _actionMessage.value = "Goal saved."
                onSuccess()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to save goal."
            }
        }
    }

    fun addProgressToGoal(goalId: String, currentSaved: Double, delta: Double) {
        viewModelScope.launch {
            val next = (currentSaved + delta).coerceAtLeast(0.0)
            moneyRepo.updateGoalSavedAmount(goalId, next).onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Could not update goal."
            }
        }
    }

    fun updateFinancialGoal(
        goalId: String,
        name: String,
        kind: String,
        targetAmount: Double,
        savedAmount: Double,
        monthKey: String,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            val res = moneyRepo.updateGoal(goalId, name, kind, targetAmount, savedAmount, monthKey)
            _actionBusy.value = false
            res.onSuccess {
                _actionMessage.value = "Budget / savings goal updated."
                onSuccess()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to update goal."
            }
        }
    }

    fun deleteFinancialGoal(goalId: String) {
        viewModelScope.launch {
            moneyRepo.deleteGoal(goalId).onSuccess {
                _actionMessage.value = "Goal deleted."
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Could not delete goal."
            }
        }
    }

    fun submitFarmerQuery(
        farmerName: String,
        cropName: String,
        category: String,
        description: String,
        district: String,
        cropBitmap: Bitmap?,
        language: AppLanguage,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            var imageSummary = ""
            if (cropBitmap != null) {
                val aiRes = aiRepo.analyzeCropImageSummary(cropBitmap, cropName, language)
                imageSummary = aiRes.getOrElse {
                    "Crop photo selected on device (AI pre-scan unavailable: ${it.localizedMessage ?: "network error"})."
                }
            }
            val res = farmerRepo.submitQuery(
                farmerName = farmerName,
                cropName = cropName,
                category = category,
                description = description,
                district = district,
                hasImage = cropBitmap != null,
                imageSummary = imageSummary
            )
            _actionBusy.value = false
            res.onSuccess {
                _actionMessage.value = "Crop query submitted! Track status below."
                telemetryRepo.touchUserPresence()
                telemetryRepo.logActivityEvent(
                    userRole = currentRole(),
                    eventType = "QUERY_SUBMITTED",
                    module = "FARMER",
                    detail = "$cropName ($category)"
                )
                onSuccess()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to submit query."
                telemetryRepo.logError("FIRESTORE", "WARNING", "FARMER_QUERY", err.localizedMessage ?: "Query submit failed")
            }
        }
    }

    fun deleteOpenFarmerQuery(queryId: String) {
        viewModelScope.launch {
            farmerRepo.deleteQuery(queryId).onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Only open queries can be deleted."
            }
        }
    }

    fun recordQuizAttempt(semester: Long, score: Long, totalQuestions: Long) {
        viewModelScope.launch {
            academicRepo.recordQuizAttempt(semester, score, totalQuestions).onSuccess {
                _actionMessage.value = "Exam score saved ($score/$totalQuestions)."
                telemetryRepo.touchUserPresence()
                telemetryRepo.logExamStat(semester, score, totalQuestions)
                telemetryRepo.logActivityEvent(
                    userRole = currentRole(),
                    eventType = "EXAM_COMPLETED",
                    module = "STUDENT",
                    detail = "Sem $semester MCQ Exam: $score/$totalQuestions"
                )
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to save quiz score."
                telemetryRepo.logError("FIRESTORE", "WARNING", "ONLINE_EXAM", err.localizedMessage ?: "Quiz save failed")
            }
        }
    }

    fun createCommunityPost(
        authorName: String,
        collegeGroup: String,
        topic: String,
        title: String,
        body: String,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _actionBusy.value = true
            val res = academicRepo.createCommunityPost(authorName, collegeGroup, topic, title, body)
            _actionBusy.value = false
            res.onSuccess {
                _actionMessage.value = "Posted to Guru Ji Vision Community."
                telemetryRepo.touchUserPresence()
                telemetryRepo.logActivityEvent(
                    userRole = currentRole(),
                    eventType = "POST_CREATED",
                    module = "COMMUNITY",
                    detail = "${topic}: ${title.take(100)}"
                )
                onSuccess()
            }.onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Failed to publish post."
                telemetryRepo.logError("FIRESTORE", "WARNING", "COMMUNITY", err.localizedMessage ?: "Post publish failed")
            }
        }
    }

    fun upvoteCommunityPost(postId: String) {
        viewModelScope.launch {
            academicRepo.upvoteCommunityPost(postId).onFailure { err ->
                _actionMessage.value = err.localizedMessage ?: "Could not mark helpful."
            }
        }
    }
}
