package com.example.viewmodel

import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.core.AiGuruLocalStore
import com.example.core.AppLanguage
import com.example.core.StoredAiMessage
import com.example.data.model.AppSettings
import com.example.data.model.StudyMaterial
import com.example.data.repository.AgriAiRepository
import com.example.data.repository.AiSourceLink
import com.example.data.repository.AiStudyMode
import com.example.data.repository.FreeWebSearchService
import com.example.data.repository.KnowledgeBaseEngine
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private const val AI_VM_TAG = "AiAssistantVM"
private const val SEND_COOLDOWN_MS = 4_000L

data class AiChatMessage(
    val id: String,
    val fromUser: Boolean,
    val text: String,
    val hasCropPhoto: Boolean = false,
    val isStreaming: Boolean = false,
    val studyMode: String = AiStudyMode.GENERAL.code,
    val usedKnowledgeBase: Boolean = false,
    val sources: List<AiSourceLink> = emptyList(),
    val timestampMs: Long = System.currentTimeMillis()
)

data class AiAssistantUiState(
    val messages: List<AiChatMessage> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val selectedMode: AiStudyMode = AiStudyMode.GENERAL,
    val freeWebSearchPreferred: Boolean = true,
    val usedToday: Int = 0,
    val dailyLimit: Int = 25,
    val activeModelName: String = AgriAiRepository.MODEL_FLASH_FREE,
    val historyLoaded: Boolean = false
)

class AiAssistantViewModel(
    private val aiRepo: AgriAiRepository = AgriAiRepository(),
    private val localStore: AiGuruLocalStore? = null,
    private val userId: String = "",
    private val webSearchService: FreeWebSearchService = FreeWebSearchService()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AiAssistantUiState())
    val uiState: StateFlow<AiAssistantUiState> = _uiState.asStateFlow()

    private var lastSentEpochMs: Long = 0L

    init {
        if (localStore != null && userId.isNotBlank()) {
            viewModelScope.launch {
                try {
                    val savedHistory = localStore.loadChatHistory(userId)
                    val usedToday = localStore.getUsedCountToday(userId)
                    _uiState.update { state ->
                        state.copy(
                            messages = savedHistory.map { it.toChatMessage() },
                            usedToday = usedToday,
                            historyLoaded = true
                        )
                    }
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    Log.w(AI_VM_TAG, "Unable to load saved AI Guru history", e)
                    _uiState.update { it.copy(historyLoaded = true) }
                }
            }
        } else {
            _uiState.update { it.copy(historyLoaded = true) }
        }
    }

    fun selectStudyMode(mode: AiStudyMode) {
        _uiState.update { it.copy(selectedMode = mode) }
    }

    fun toggleFreeWebSearch(enabled: Boolean) {
        _uiState.update { it.copy(freeWebSearchPreferred = enabled) }
    }

    fun sendQuestion(
        question: String,
        attachedBitmap: Bitmap?,
        language: AppLanguage,
        appSettings: AppSettings = AppSettings(),
        knowledgeBaseMaterials: List<StudyMaterial> = emptyList()
    ) {
        val cleanQuestion = question.trim()
        if (cleanQuestion.isBlank() && attachedBitmap == null) return

        // 1. Respect Admin master kill-switch
        if (!appSettings.aiAssistantEnabled) {
            _uiState.update {
                it.copy(
                    errorMessage = if (language == AppLanguage.BN) {
                        "অ্যাডমিন বর্তমানে AI Guru পরিষেবা সাময়িকভাবে বন্ধ রেখেছেন। অনুগ্রহ করে পরে চেষ্টা করুন।"
                    } else {
                        "AI Guru is currently disabled by the Admin. Please try again later."
                    }
                )
            }
            return
        }

        // 2. Anti-abuse rate cooldown (4s between requests)
        val nowMs = System.currentTimeMillis()
        if (nowMs - lastSentEpochMs < SEND_COOLDOWN_MS) {
            _uiState.update {
                it.copy(
                    errorMessage = if (language == AppLanguage.BN) {
                        "অনুগ্রহ করে পরবর্তী প্রশ্ন পাঠানোর আগে কয়েক সেকেন্ড অপেক্ষা করুন।"
                    } else {
                        "Please wait a few seconds before sending another question."
                    }
                )
            }
            return
        }

        // 3. Enforce per-user daily free usage limit
        val dailyLimit = appSettings.aiDailyLimitPerUser.toInt().coerceIn(1, 200)
        val currentUsed = _uiState.value.usedToday
        if (currentUsed >= dailyLimit) {
            _uiState.update {
                it.copy(
                    dailyLimit = dailyLimit,
                    errorMessage = if (language == AppLanguage.BN) {
                        "আপনার আজকের ফ্রি AI Guru সীমা ($dailyLimit টি প্রশ্ন) পূর্ণ হয়েছে। কোনো চার্জ কাটা হয়নি — অনুগ্রহ করে আগামীকাল আবার চেষ্টা করুন।"
                    } else {
                        "You have reached today's free AI Guru limit ($dailyLimit questions). No paid service is used — please try again tomorrow."
                    }
                )
            }
            return
        }

        lastSentEpochMs = nowMs

        val effectivePrompt = cleanQuestion.ifBlank {
            if (language == AppLanguage.BN) {
                "এই ফসলের ছবিটি বিশ্লেষণ করুন এবং সম্ভাব্য রোগ/পোকা ও নিরাপদ সমাধান বলুন।"
            } else {
                "Analyze this crop photo, identify possible stress, disease, or pest symptoms, and suggest safe agronomic management."
            }
        }

        val currentMode = _uiState.value.selectedMode
        val safeModelName = AgriAiRepository.sanitizeFreeModelName(appSettings.aiModelName)
        val priorHistory = _uiState.value.messages
            .filter { !it.isStreaming && it.text.isNotBlank() }
            .takeLast(6)
            .map { it.fromUser to it.text }

        val userMsgId = "u_${nowMs}"
        val botMsgId = "b_${nowMs + 1}"

        _uiState.update { state ->
            state.copy(
                messages = state.messages + AiChatMessage(
                    id = userMsgId,
                    fromUser = true,
                    text = effectivePrompt,
                    hasCropPhoto = attachedBitmap != null,
                    studyMode = currentMode.code,
                    timestampMs = nowMs
                ) + AiChatMessage(
                    id = botMsgId,
                    fromUser = false,
                    text = "",
                    isStreaming = true,
                    studyMode = currentMode.code,
                    timestampMs = nowMs + 1
                ),
                isLoading = true,
                errorMessage = null,
                dailyLimit = dailyLimit,
                activeModelName = safeModelName
            )
        }

        viewModelScope.launch {
            try {
                // Step A: Retrieve priority Verified Guru Ji Vision Knowledge Base materials
                val kbMatches = KnowledgeBaseEngine.findRelevantMaterials(
                    question = effectivePrompt,
                    materials = knowledgeBaseMaterials,
                    maxMatches = 3
                )
                val kbContextBlock = KnowledgeBaseEngine.buildPromptContextBlock(kbMatches)
                val kbSources = KnowledgeBaseEngine.toSourceLinks(kbMatches)

                // Step B: Optional genuinely FREE Wikipedia search (only when enabled by Admin + User & text-only/general query)
                val webSources = if (
                    appSettings.aiFreeSearchEnabled &&
                    _uiState.value.freeWebSearchPreferred &&
                    attachedBitmap == null
                ) {
                    webSearchService.searchFreeEncyclopedia(
                        query = effectivePrompt,
                        language = language,
                        maxResults = 2
                    )
                } else {
                    emptyList()
                }

                val combinedSources = (kbSources + webSources).distinctBy { "${it.kind}_${it.title}" }

                // Step C: Stream answer from strictly Free-Tier Gemini model via Firebase AI Logic
                aiRepo.askAssistantStream(
                    question = effectivePrompt,
                    bitmap = attachedBitmap,
                    language = language,
                    modelName = safeModelName,
                    studyMode = currentMode,
                    knowledgeBaseContext = kbContextBlock,
                    webSearchSources = webSources,
                    recentHistory = priorHistory
                ).collect { partialText ->
                    _uiState.update { state ->
                        state.copy(
                            messages = state.messages.map { msg ->
                                if (msg.id == botMsgId) {
                                    msg.copy(
                                        text = partialText,
                                        isStreaming = true,
                                        usedKnowledgeBase = kbMatches.isNotEmpty(),
                                        sources = combinedSources
                                    )
                                } else msg
                            }
                        )
                    }
                }

                val newUsedToday = if (localStore != null && userId.isNotBlank()) {
                    localStore.incrementUsedCountToday(userId)
                } else {
                    currentUsed + 1
                }

                _uiState.update { state ->
                    state.copy(
                        messages = state.messages.map { msg ->
                            if (msg.id == botMsgId) {
                                msg.copy(
                                    isStreaming = false,
                                    usedKnowledgeBase = kbMatches.isNotEmpty(),
                                    sources = combinedSources
                                )
                            } else msg
                        },
                        isLoading = false,
                        usedToday = newUsedToday
                    )
                }

                persistHistory()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(AI_VM_TAG, "AI Guru streaming error", e)
                _uiState.update { state ->
                    state.copy(
                        messages = state.messages.filterNot { it.id == botMsgId && it.text.isBlank() }
                            .map { if (it.id == botMsgId) it.copy(isStreaming = false) else it },
                        isLoading = false,
                        errorMessage = e.localizedMessage
                            ?: AgriAiRepository.toUserFriendlyError(e, language)
                    )
                }
                persistHistory()
            }
        }
    }

    private fun persistHistory() {
        val store = localStore ?: return
        if (userId.isBlank()) return
        val snapshot = _uiState.value.messages
            .filter { !it.isStreaming && it.text.isNotBlank() }
            .map { it.toStored() }
        viewModelScope.launch {
            try {
                store.saveChatHistory(userId, snapshot)
            } catch (e: Exception) {
                Log.w(AI_VM_TAG, "Failed to persist AI Guru history", e)
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun clearConversation() {
        _uiState.update { state ->
            state.copy(messages = emptyList(), errorMessage = null)
        }
        if (localStore != null && userId.isNotBlank()) {
            viewModelScope.launch {
                try {
                    localStore.clearChatHistory(userId)
                } catch (e: Exception) {
                    Log.w(AI_VM_TAG, "Failed to clear persisted AI Guru history", e)
                }
            }
        }
    }

    private fun StoredAiMessage.toChatMessage(): AiChatMessage = AiChatMessage(
        id = id,
        fromUser = fromUser,
        text = text,
        hasCropPhoto = hasCropPhoto,
        isStreaming = false,
        studyMode = studyMode,
        usedKnowledgeBase = usedKnowledgeBase,
        sources = sources,
        timestampMs = timestampMs
    )

    private fun AiChatMessage.toStored(): StoredAiMessage = StoredAiMessage(
        id = id,
        fromUser = fromUser,
        text = text,
        hasCropPhoto = hasCropPhoto,
        studyMode = studyMode,
        usedKnowledgeBase = usedKnowledgeBase,
        sources = sources,
        timestampMs = timestampMs
    )
}
