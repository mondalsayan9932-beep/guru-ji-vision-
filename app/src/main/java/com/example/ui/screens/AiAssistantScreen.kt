package com.example.ui.screens

import android.graphics.Bitmap
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Public
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.data.model.AppSettings
import com.example.data.repository.AiSourceLink
import com.example.data.repository.AiStudyMode
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.StatusPill
import com.example.ui.components.decodeScaledBitmap
import com.example.ui.components.openExternalUrl
import com.example.viewmodel.AiAssistantUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AiAssistantScreen(
    language: AppLanguage,
    uiState: AiAssistantUiState,
    appSettings: AppSettings = AppSettings(),
    knowledgeBaseCount: Int = 0,
    onSelectStudyMode: (AiStudyMode) -> Unit = {},
    onToggleFreeWebSearch: (Boolean) -> Unit = {},
    onSendQuestion: (question: String, bitmap: Bitmap?, language: AppLanguage) -> Unit,
    onClearConversation: () -> Unit
) {
    val context = LocalContext.current
    var promptText by remember { mutableStateOf("") }
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var selectedBitmap by remember { mutableStateOf<Bitmap?>(null) }
    val listState = rememberLazyListState()

    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        selectedUri = uri
        selectedBitmap = uri?.let { decodeScaledBitmap(context, it, maxDimPx = 1024) }
    }

    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.lastIndex)
        }
    }

    val effectiveDailyLimit = appSettings.aiDailyLimitPerUser.toInt().coerceIn(1, 200)
    val remainingToday = (effectiveDailyLimit - uiState.usedToday).coerceAtLeast(0)

    val quickPrompts = if (language == AppLanguage.BN) {
        listOf(
            "Soil pH ও CEC এর পার্থক্য পরীক্ষার উপযোগী উত্তর হিসেবে লিখুন",
            "ধানের ব্লাস্ট রোগের লক্ষণ, জীবাণু ও নিরাপদ IPM প্রতিকার কী?",
            "মেন্ডেলের বংশগতি সূত্র (Genetics) সহজ ভাষায় উদাহরণসহ বোঝান",
            "উদ্ভিদ টিস্যু কালচার (Botany) সম্পর্কে সংক্ষিপ্ত নোটস দিন",
            "পতঙ্গবিজ্ঞান (Entomology): IPM এর মূল নীতিগুলো কী কী?"
        )
    } else {
        listOf(
            "Explain Soil CEC vs Soil pH for B.Sc Agriculture exam answer",
            "Symptoms, pathogen & safe IPM control for Rice Blast (Plant Pathology)",
            "Simple notes on Mendel's Laws of Inheritance & Heterosis (Genetics)",
            "Short revision summary on Plant Tissue Culture (Botany)",
            "Integrated Pest Management (IPM) principles in Entomology"
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Preserved Branded Header Strip (AI Guru – Free Tier)
        Surface(
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.AutoAwesome,
                            contentDescription = "AI Guru",
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = L10n.aiAssistant(language),
                                    style = MaterialTheme.typography.titleMedium
                                )
                                StatusPill(
                                    label = t(language, "FREE TIER", "ফ্রি"),
                                    containerColor = MaterialTheme.colorScheme.primary,
                                    contentColor = Color.White
                                )
                            }
                            Text(
                                text = t(
                                    language,
                                    "English & বাংলা • $knowledgeBaseCount Verified Notes • $remainingToday/$effectiveDailyLimit left today",
                                    "ইংরেজি ও বাংলা • $knowledgeBaseCount টি যাচাইকৃত নোটস • আজ বাকি $remainingToday/$effectiveDailyLimit"
                                ),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    if (uiState.messages.isNotEmpty()) {
                        IconButton(
                            onClick = onClearConversation,
                            modifier = Modifier.testTag("ai_clear_chat_button")
                        ) {
                            Icon(Icons.Filled.DeleteSweep, contentDescription = "Clear conversation")
                        }
                    }
                }

                // Study Modes + Optional Free Wikipedia Search Chip Row
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(AiStudyMode.entries) { mode ->
                        FilterChip(
                            selected = uiState.selectedMode == mode,
                            onClick = { onSelectStudyMode(mode) },
                            label = {
                                Text(
                                    text = if (language == AppLanguage.BN) mode.labelBn else mode.labelEn,
                                    maxLines = 1
                                )
                            },
                            modifier = Modifier.testTag("ai_mode_${mode.code}")
                        )
                    }
                    if (appSettings.aiFreeSearchEnabled) {
                        item {
                            FilterChip(
                                selected = uiState.freeWebSearchPreferred,
                                onClick = { onToggleFreeWebSearch(!uiState.freeWebSearchPreferred) },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Filled.Public,
                                        contentDescription = "Free Wikipedia Search",
                                        modifier = Modifier.size(16.dp)
                                    )
                                },
                                label = {
                                    Text(
                                        text = t(language, "Free Web (Wiki)", "ফ্রি ওয়েব (Wiki)"),
                                        maxLines = 1
                                    )
                                },
                                modifier = Modifier.testTag("ai_toggle_free_search")
                            )
                        }
                    }
                }
            }
        }

        // Chat Feed (Preserves Existing Chat History)
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (uiState.errorMessage != null) {
                item {
                    ErrorBannerCard(message = uiState.errorMessage)
                }
            }

            if (uiState.messages.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.large,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = t(
                                    language,
                                    "Ask AI Guru – Agriculture, Science & Exam Prep",
                                    "AI Guru-কে কৃষি, বিজ্ঞান ও পরীক্ষার যেকোনো প্রশ্ন করুন"
                                ),
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = t(
                                    language,
                                    "Powered by Google Gemini Free Tier with priority access to verified Guru Ji Vision study materials. Ask Agronomy, Botany, Genetics, Soil Science, Plant Pathology, Entomology, general knowledge, or upload a crop photo in English or Bengali.",
                                    "ফ্রি Google Gemini AI এবং গুরু জি ভিশনের যাচাইকৃত স্টাডি ম্যাটেরিয়ালের সহায়তায় কৃষিবিজ্ঞান, উদ্ভিদবিদ্যা, জেনেটিক্স, মৃত্তিকা বিজ্ঞান, রোগতত্ত্ব, কীটতত্ত্ব ও সাধারণ জ্ঞানের সহজ উত্তর ও নোটস পান।"
                                ),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(quickPrompts) { preset ->
                            AssistChip(
                                onClick = {
                                    onSendQuestion(preset, null, language)
                                },
                                label = { Text(preset, maxLines = 1) },
                                modifier = Modifier.testTag("ai_preset_chip")
                            )
                        }
                    }
                }
            } else {
                items(uiState.messages, key = { it.id }) { msg ->
                    val isUser = msg.fromUser
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                    ) {
                        Card(
                            modifier = Modifier.fillMaxWidth(0.92f),
                            shape = RoundedCornerShape(
                                topStart = 18.dp,
                                topEnd = 18.dp,
                                bottomStart = if (isUser) 18.dp else 4.dp,
                                bottomEnd = if (isUser) 4.dp else 18.dp
                            ),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isUser) {
                                    MaterialTheme.colorScheme.primary
                                } else {
                                    MaterialTheme.colorScheme.surface
                                }
                            ),
                            border = if (isUser) null else BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (msg.hasCropPhoto) {
                                    StatusPill(
                                        label = t(language, "Crop Photo Attached", "ফসলের ছবি যুক্ত করা হয়েছে"),
                                        containerColor = MaterialTheme.colorScheme.secondary,
                                        contentColor = MaterialTheme.colorScheme.onSecondary
                                    )
                                }
                                if (!isUser && msg.usedKnowledgeBase) {
                                    StatusPill(
                                        label = t(language, "Verified Guru Ji Vision Notes Used", "যাচাইকৃত গুরু জি ভিশন নোটস ব্যবহৃত"),
                                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                                if (msg.text.isBlank() && msg.isStreaming) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                        Text(
                                            text = t(language, "AI Guru is thinking (Free Tier)...", "AI Guru উত্তর তৈরি করছে..."),
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                } else {
                                    Text(
                                        text = msg.text,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (isUser) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                                    )
                                }

                                // Source Links (Verified Guru Ji Vision Knowledge Base + Free Wikipedia Web Sources)
                                if (!isUser && !msg.isStreaming && msg.sources.isNotEmpty()) {
                                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                                    Text(
                                        text = t(language, "Sources & References", "তথ্যসূত্র"),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        msg.sources.forEach { src ->
                                            val isWeb = src.kind == AiSourceLink.KIND_WEB_WIKIPEDIA
                                            val clickable = src.url.startsWith("http://") || src.url.startsWith("https://")
                                            Surface(
                                                shape = RoundedCornerShape(10.dp),
                                                color = if (isWeb) {
                                                    MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.65f)
                                                } else {
                                                    MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.65f)
                                                },
                                                modifier = if (clickable) {
                                                    Modifier
                                                        .clip(RoundedCornerShape(10.dp))
                                                        .clickable { openExternalUrl(context, src.url) }
                                                        .testTag("ai_source_chip")
                                                } else {
                                                    Modifier.testTag("ai_source_chip")
                                                }
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    Icon(
                                                        imageVector = if (isWeb) Icons.Filled.Public else Icons.AutoMirrored.Filled.MenuBook,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(14.dp),
                                                        tint = MaterialTheme.colorScheme.primary
                                                    )
                                                    Text(
                                                        text = src.title.take(46),
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                    if (clickable) {
                                                        Icon(
                                                            imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                                                            contentDescription = "Open source link",
                                                            modifier = Modifier.size(12.dp),
                                                            tint = MaterialTheme.colorScheme.primary
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Preserved Composer Footer
        Surface(
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 4.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (selectedUri != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        AsyncImage(
                            model = selectedUri,
                            contentDescription = "Selected crop photo",
                            modifier = Modifier
                                .size(52.dp)
                                .clip(RoundedCornerShape(10.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Text(
                            text = t(language, "Crop image ready for analysis", "ছবি বিশ্লেষণের জন্য প্রস্তুত"),
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = {
                            selectedUri = null
                            selectedBitmap = null
                        }) {
                            Icon(Icons.Filled.Close, contentDescription = "Remove photo")
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    IconButton(
                        onClick = {
                            photoPicker.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        enabled = !uiState.isLoading,
                        modifier = Modifier.testTag("ai_attach_photo_button")
                    ) {
                        Icon(
                            imageVector = Icons.Filled.AddPhotoAlternate,
                            contentDescription = "Attach crop photo",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    OutlinedTextField(
                        value = promptText,
                        onValueChange = { promptText = it },
                        placeholder = {
                            Text(
                                t(language, "Ask AI Guru (Agri, Exam, Notes, GK)...", "AI Guru-কে যেকোনো প্রশ্ন লিখুন...")
                            )
                        },
                        maxLines = 3,
                        modifier = Modifier
                            .weight(1f)
                            .testTag("ai_prompt_input")
                    )

                    IconButton(
                        onClick = {
                            val currentPrompt = promptText
                            val currentBmp = selectedBitmap
                            promptText = ""
                            selectedUri = null
                            selectedBitmap = null
                            onSendQuestion(currentPrompt, currentBmp, language)
                        },
                        enabled = !uiState.isLoading && (promptText.isNotBlank() || selectedBitmap != null),
                        modifier = Modifier.testTag("ai_send_button")
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Send",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }
    }
}
