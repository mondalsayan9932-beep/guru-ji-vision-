package com.example.ui.screens

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.core.AppLanguage
import com.example.core.t
import com.example.data.model.AiUsageLog
import com.example.data.model.AppSettings
import com.example.data.model.StudyMaterial
import com.example.data.model.UiState
import com.example.data.repository.AgriAiRepository
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.viewmodel.AiConnectionTestUiState
import java.util.Calendar

private fun resolveDocumentDisplayName(context: Context, uri: Uri): String {
    return try {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
            ?.use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0) else null
            } ?: "study_document"
    } catch (_: Exception) {
        "study_document"
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AdminAiGuruPanel(
    language: AppLanguage,
    appSettings: AppSettings,
    aiUsageLogsState: UiState<List<AiUsageLog>>,
    studyMaterialsState: UiState<List<StudyMaterial>>,
    connectionTestState: AiConnectionTestUiState,
    pdfExtracting: Boolean,
    busy: Boolean,
    onTestConnection: (modelName: String) -> Unit,
    onSaveAiSettings: (enabled: Boolean, modelName: String, freeSearchEnabled: Boolean, dailyLimit: Long) -> Unit,
    onExtractPdfNotes: (pdfBytes: ByteArray, fileName: String, modelName: String, onExtracted: (String) -> Unit) -> Unit,
    onPublishKnowledgeMaterial: (
        title: String,
        semester: Long,
        subject: String,
        category: String,
        summary: String,
        resourceUrl: String,
        contentText: String,
        verifiedForAi: Boolean,
        onDone: () -> Unit
    ) -> Unit
) {
    val context = LocalContext.current

    var aiEnabled by remember(appSettings.aiAssistantEnabled) { mutableStateOf(appSettings.aiAssistantEnabled) }
    var selectedModel by remember(appSettings.aiModelName) {
        mutableStateOf(AgriAiRepository.sanitizeFreeModelName(appSettings.aiModelName))
    }
    var freeSearchEnabled by remember(appSettings.aiFreeSearchEnabled) { mutableStateOf(appSettings.aiFreeSearchEnabled) }
    var dailyLimit by remember(appSettings.aiDailyLimitPerUser) {
        mutableLongStateOf(appSettings.aiDailyLimitPerUser.coerceIn(1L, 200L))
    }

    // Knowledge Base Upload form state
    var kbTitle by remember { mutableStateOf("") }
    var kbSubject by remember { mutableStateOf("Agronomy") }
    var kbSemester by remember { mutableLongStateOf(1L) }
    var kbCategory by remember { mutableStateOf("NOTES_PDF") }
    var kbSummary by remember { mutableStateOf("") }
    var kbContentText by remember { mutableStateOf("") }
    var kbUrl by remember { mutableStateOf("") }
    var kbVerifiedForAi by remember { mutableStateOf(true) }
    var kbPickerNotice by remember { mutableStateOf<String?>(null) }

    // Zero-permission SAF Document Picker for educational PDF / TXT files
    val docPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        val fileName = resolveDocumentDisplayName(context, uri)
        val mime = context.contentResolver.getType(uri).orEmpty().lowercase()
        try {
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            if (bytes == null || bytes.isEmpty()) {
                kbPickerNotice = "Could not read selected file."
                return@rememberLauncherForActivityResult
            }
            if (kbTitle.isBlank()) {
                kbTitle = fileName.substringBeforeLast('.').replace('_', ' ').take(140)
            }
            if (mime.contains("text") || fileName.endsWith(".txt", ignoreCase = true)) {
                val decoded = bytes.toString(Charsets.UTF_8).trim().take(12_000)
                kbContentText = decoded
                if (kbSummary.isBlank()) {
                    kbSummary = decoded.take(220).ifBlank { "Uploaded study notes from $fileName" }
                }
                kbPickerNotice = "Loaded ${decoded.length} characters directly from $fileName."
            } else {
                kbPickerNotice = "Extracting study notes from PDF ($fileName) using Free-Tier Gemini..."
                onExtractPdfNotes(bytes, fileName, selectedModel) { extracted ->
                    kbContentText = extracted
                    if (kbSummary.isBlank()) {
                        kbSummary = extracted.lineSequence().firstOrNull { it.isNotBlank() }?.take(220)
                            ?: "Verified study notes extracted from $fileName"
                    }
                    kbPickerNotice = "PDF extracted (${extracted.length} chars). Review and tap Publish."
                }
            }
        } catch (e: Exception) {
            kbPickerNotice = "Unable to open file: ${e.localizedMessage ?: "Unknown error"}"
        }
    }

    val usageLogs = (aiUsageLogsState as? UiState.Success)?.data.orEmpty()
    val startOfTodaySec = remember {
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis / 1000L
    }
    val todayCalls = usageLogs.count { (it.createdAt?.seconds ?: 0L) >= startOfTodaySec }
    val totalCalls = usageLogs.size
    val successCalls = usageLogs.count { it.success }
    val successPct = if (totalCalls == 0) 100 else (successCalls * 100 / totalCalls)
    val totalTokens = usageLogs.sumOf { it.promptTokens + it.outputTokens }
    val verifiedKbMaterials = (studyMaterialsState as? UiState.Success)?.data
        .orEmpty()
        .filter { it.published && it.verifiedForAi }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(
            title = t(language, "AI Guru – Free AI Settings & Knowledge Base", "AI Guru – ফ্রি এআই সেটিংস ও নলেজ বেস"),
            subtitle = t(
                language,
                "Strictly Free-Tier Google Gemini API via Firebase App Check • Zero Paid Auto-Charges",
                "সম্পূর্ণ ফ্রি-টিয়ার Gemini AI • অ্যাপে কোনো API কী নেই • অপ্রত্যাশিত চার্জ নেই"
            )
        )

        // 1. Provider, Security & Live Connection Status Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_ai_provider_card"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.45f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Text("AI Provider & Connection Status", style = MaterialTheme.typography.titleMedium)
                    }
                    StatusPill(
                        label = if (aiEnabled) "FREE TIER ACTIVE" else "DISABLED",
                        containerColor = if (aiEnabled) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer,
                        contentColor = if (aiEnabled) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                    )
                }

                Text(
                    text = "Provider: Google Gemini API (Free Usage Tier) via Firebase AI Logic",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Active Free Model: $selectedModel • Billing Required: NO (₹0)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Security: Secured server-side via Firebase App Check attestation. Zero API keys are stored in frontend code or the APK.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Paid Services Policy: Locked OFF. Paid models (e.g., gemini-4-argon) and paid Google Search APIs are blocked in both app logic and Firestore Security Rules.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                // Live Connection Test Result
                when (connectionTestState) {
                    AiConnectionTestUiState.Idle -> {
                        Text(
                            text = "Tap below to verify real live connectivity to Google Gemini Free Tier.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    AiConnectionTestUiState.Testing -> {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                            Text("Testing live Gemini Free Tier ($selectedModel)...", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    is AiConnectionTestUiState.Connected -> {
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Filled.CloudDone, contentDescription = "Connected", tint = Color(0xFF15803D))
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = "Connected • ${connectionTestState.result.modelName} (${connectionTestState.result.latencyMs}ms)",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = Color(0xFF15803D)
                                )
                                Text(
                                    text = connectionTestState.result.replyPreview,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                    is AiConnectionTestUiState.Failed -> {
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Filled.ErrorOutline, contentDescription = "Failed", tint = MaterialTheme.colorScheme.error)
                            Text(
                                text = connectionTestState.message,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }

                Button(
                    onClick = { onTestConnection(selectedModel) },
                    enabled = connectionTestState !is AiConnectionTestUiState.Testing && !busy,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("admin_test_ai_connection_button")
                ) {
                    Icon(Icons.Filled.NetworkCheck, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Test Live AI Connection")
                }
            }
        }

        // 2. Real Quota & Free Usage Monitoring Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Free-Tier Usage & Quota Overview", style = MaterialTheme.typography.titleMedium)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f))
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text("Today's Requests", style = MaterialTheme.typography.labelSmall)
                            Text("$todayCalls", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f))
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text("Total / Success", style = MaterialTheme.typography.labelSmall)
                            Text("$totalCalls ($successPct%)", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Text(
                    text = "Logged Tokens: $totalTokens • Verified Knowledge Base Docs: ${verifiedKbMaterials.size} • Daily User Cap: $dailyLimit Q/day",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Quota Note: Google Gemini Free Tier enforces dynamic per-minute/per-day rate limits on the server. When exhausted, AI Guru shows a friendly retry-later notice and never triggers paid billing.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // 3. Admin AI Controls Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_ai_controls_card"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Admin AI Guru Controls", style = MaterialTheme.typography.titleMedium)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Enable AI Guru Service", style = MaterialTheme.typography.labelLarge)
                        Text(
                            "Turn off immediately to pause all student/farmer AI queries.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = aiEnabled,
                        onCheckedChange = { aiEnabled = it },
                        modifier = Modifier.testTag("admin_ai_enabled_switch")
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                Text("Free-Tier Gemini Model (Billing Not Required)", style = MaterialTheme.typography.labelLarge)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = selectedModel == AgriAiRepository.MODEL_FLASH_FREE,
                        onClick = { selectedModel = AgriAiRepository.MODEL_FLASH_FREE },
                        label = { Text("gemini-3.8-flash (Recommended Free)") },
                        modifier = Modifier.testTag("admin_model_flash")
                    )
                    FilterChip(
                        selected = selectedModel == AgriAiRepository.MODEL_FLASH_LITE_FREE,
                        onClick = { selectedModel = AgriAiRepository.MODEL_FLASH_LITE_FREE },
                        label = { Text("gemini-3.5-flash-lite (Ultra-Fast Free)") },
                        modifier = Modifier.testTag("admin_model_lite")
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Free Web Search (Wikipedia EN / BN)", style = MaterialTheme.typography.labelLarge)
                        Text(
                            "Uses genuinely free Wikimedia Open API with clickable source links. Zero paid search API.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = freeSearchEnabled,
                        onCheckedChange = { freeSearchEnabled = it },
                        modifier = Modifier.testTag("admin_ai_free_search_switch")
                    )
                }

                Text("Daily Free Question Limit Per User (Anti-Abuse Guard)", style = MaterialTheme.typography.labelLarge)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(10L, 25L, 50L, 100L).forEach { cap ->
                        FilterChip(
                            selected = dailyLimit == cap,
                            onClick = { dailyLimit = cap },
                            label = { Text("$cap / day") },
                            modifier = Modifier.testTag("admin_ai_limit_$cap")
                        )
                    }
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f))
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Filled.Lock, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        Text(
                            "Paid AI Services: DISABLED. Automatic paid fallback is permanently blocked.",
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }

                Button(
                    onClick = {
                        onSaveAiSettings(aiEnabled, selectedModel, freeSearchEnabled, dailyLimit)
                    },
                    enabled = !busy,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("admin_save_ai_settings_button")
                ) {
                    Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Save AI Guru Settings")
                }
            }
        }

        // 4. Upload Educational PDFs / Notes to AI Guru Verified Knowledge Base
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_ai_kb_upload_card"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.45f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text("Upload Verified Knowledge Base (PDF / Notes)", style = MaterialTheme.typography.titleMedium)
                }
                Text(
                    text = "Upload a PDF or TXT study document, or paste verified lecture notes below. AI Guru automatically prioritizes these verified Guru Ji Vision resources when answering students.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                OutlinedButton(
                    onClick = {
                        docPicker.launch(arrayOf("application/pdf", "text/plain"))
                    },
                    enabled = !pdfExtracting && !busy,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("admin_pick_kb_pdf_button")
                ) {
                    if (pdfExtracting) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.width(8.dp))
                        Text("Extracting PDF study text...")
                    } else {
                        Icon(Icons.Filled.UploadFile, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Pick Educational PDF or TXT File (<= 10 MB)")
                    }
                }

                if (!kbPickerNotice.isNullOrBlank()) {
                    Text(
                        text = kbPickerNotice!!,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                OutlinedTextField(
                    value = kbTitle,
                    onValueChange = { kbTitle = it },
                    label = { Text("Resource Title *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("admin_kb_title_input")
                )

                Text("Subject", style = MaterialTheme.typography.labelMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(
                        "Agronomy", "Botany", "Soil Science", "Genetics",
                        "Plant Pathology", "Entomology", "Agriculture", "Extension"
                    ).forEach { subj ->
                        FilterChip(
                            selected = kbSubject.equals(subj, ignoreCase = true),
                            onClick = { kbSubject = subj },
                            label = { Text(subj) }
                        )
                    }
                }
                OutlinedTextField(
                    value = kbSubject,
                    onValueChange = { kbSubject = it },
                    label = { Text("Custom Subject *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    (1L..8L).forEach { s ->
                        FilterChip(selected = kbSemester == s, onClick = { kbSemester = s }, label = { Text("Sem $s") })
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("NOTES_PDF", "PRACTICAL", "PYQ", "VIDEO_LECTURE").forEach { c ->
                        FilterChip(selected = kbCategory == c, onClick = { kbCategory = c }, label = { Text(c) })
                    }
                }

                OutlinedTextField(
                    value = kbSummary,
                    onValueChange = { kbSummary = it },
                    label = { Text("Short Summary (shown to students) *") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth().testTag("admin_kb_summary_input")
                )
                OutlinedTextField(
                    value = kbContentText,
                    onValueChange = { kbContentText = it.take(12_000) },
                    label = { Text("Extracted PDF / Full Study Notes for AI Guru (max 12,000 chars)") },
                    minLines = 4,
                    maxLines = 8,
                    modifier = Modifier.fillMaxWidth().testTag("admin_kb_content_input")
                )
                OutlinedTextField(
                    value = kbUrl,
                    onValueChange = { kbUrl = it },
                    label = { Text("Optional PDF / Drive / ICAR Reference URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Prioritize in AI Guru Knowledge Base", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                    Switch(checked = kbVerifiedForAi, onCheckedChange = { kbVerifiedForAi = it })
                }

                Button(
                    onClick = {
                        onPublishKnowledgeMaterial(
                            kbTitle,
                            kbSemester,
                            kbSubject,
                            kbCategory,
                            kbSummary,
                            kbUrl,
                            kbContentText,
                            kbVerifiedForAi
                        ) {
                            kbTitle = ""
                            kbSummary = ""
                            kbContentText = ""
                            kbUrl = ""
                            kbPickerNotice = null
                        }
                    },
                    enabled = !busy && !pdfExtracting && kbTitle.trim().length >= 2 && kbSubject.trim().length >= 2 && kbSummary.trim().length >= 5,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("admin_publish_kb_button")
                ) {
                    Text("Publish to Student Portal & AI Guru Knowledge Base")
                }

                if (verifiedKbMaterials.isNotEmpty()) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Text(
                        text = "Active Verified AI Knowledge Base (${verifiedKbMaterials.size})",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    verifiedKbMaterials.take(6).forEach { mat ->
                        Text(
                            text = "• ${mat.title} (${mat.subject}, Sem ${mat.semester}) ${if (mat.contentText.isNotBlank()) "✓ Full text indexed" else "✓ Summary indexed"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
