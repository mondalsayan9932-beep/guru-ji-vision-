package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PlayCircleOutline
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.data.model.QuizAttempt
import com.example.data.model.QuizQuestion
import com.example.data.model.StudyMaterial
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.StatusPill
import com.example.ui.components.openExternalUrl
import com.example.ui.components.rememberResponsiveMetrics

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StudentHubScreen(
    profile: UserProfile?,
    language: AppLanguage,
    studyMaterialsState: UiState<List<StudyMaterial>>,
    quizzesState: UiState<List<QuizQuestion>>,
    attemptsState: UiState<List<QuizAttempt>>,
    onOpenMoneyManager: () -> Unit,
    onSubmitQuizAttempt: (semester: Long, score: Long, totalQuestions: Long) -> Unit,
    unreadDoubtsCount: Int = 0,
    onOpenMeetingZone: () -> Unit = {},
    onOpenDoubtZone: () -> Unit = {}
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedSemester by remember(profile?.semester) {
        mutableLongStateOf(profile?.semester?.takeIf { it in 1L..8L } ?: 0L) // 0 = All Semesters
    }
    var selectedCategory by remember { mutableStateOf("ALL") }
    var visibleMaterialCount by remember(selectedSemester, selectedCategory) { mutableIntStateOf(20) }

    // Interactive MCQ exam session state
    val selectedAnswers = remember { mutableStateMapOf<String, Int>() }
    var examSubmitted by remember { mutableStateOf(false) }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        val metrics = rememberResponsiveMetrics(maxWidth)

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text(t(language, "Study Hub", "স্টাডি হাব"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("student_tab_study")
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text(t(language, "MCQ Exam", "MCQ পরীক্ষা"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("student_tab_exam")
            )
            Tab(
                selected = selectedTab == 2,
                onClick = { selectedTab = 2 },
                text = { Text(t(language, "My Scores", "আমার ফলাফল"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("student_tab_scores")
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = metrics.contentMaxWidth),
            contentPadding = metrics.screenContentPadding,
            verticalArrangement = Arrangement.spacedBy(metrics.itemSpacing)
        ) {
            // Editorial Banner + Student Money Manager CTA
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(MaterialTheme.shapes.large)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.img_student_portal_art_1795234984986),
                        contentDescription = "B.Sc Agriculture Study Hub",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.matchParentSize()
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(
                                Brush.horizontalGradient(
                                    listOf(
                                        Color(0xFF0A2E18).copy(alpha = 0.88f),
                                        Color(0xFF0A2E18).copy(alpha = 0.32f)
                                    )
                                )
                            )
                    )
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 156.dp)
                            .padding(metrics.cardPadding),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = t(language, "B.Sc Agriculture Portal", "B.Sc কৃষি শিক্ষার্থী পোর্টাল"),
                                style = MaterialTheme.typography.headlineSmall,
                                color = Color.White
                            )
                            Text(
                                text = t(
                                    language,
                                    "ICAR Semester 1–8 Notes, PYQs, Practicals & Exams",
                                    "সেমিস্টার ১–৮ নোটস, ভিডিও, প্র্যাকটিক্যাল ও অনলাইন পরীক্ষা"
                                ),
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = onOpenMoneyManager,
                            modifier = Modifier
                                .heightIn(min = 48.dp)
                                .testTag("student_open_money_manager_button"),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.AccountBalanceWallet,
                                contentDescription = "Money Manager",
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = L10n.moneyManager(language) + " (₹)",
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }

            // Quick shortcuts to Meeting Zone & Doubt Zone
            item {
                val meetingShortcut: @Composable (Modifier) -> Unit = { mod ->
                    OutlinedButton(
                        onClick = onOpenMeetingZone,
                        modifier = mod
                            .heightIn(min = 48.dp)
                            .testTag("student_open_meeting_zone_button"),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.VideoCall,
                            contentDescription = "Meeting Zone",
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = L10n.meetingZone(language),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                val doubtShortcut: @Composable (Modifier) -> Unit = { mod ->
                    Button(
                        onClick = onOpenDoubtZone,
                        modifier = mod
                            .heightIn(min = 48.dp)
                            .testTag("student_open_doubt_zone_button"),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Forum,
                            contentDescription = "Doubt Zone",
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (unreadDoubtsCount > 0) {
                                "${L10n.doubtZone(language)} ($unreadDoubtsCount)"
                            } else {
                                L10n.doubtZone(language)
                            },
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                if (metrics.isUltraCompact) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        meetingShortcut(Modifier.fillMaxWidth())
                        doubtShortcut(Modifier.fillMaxWidth())
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        meetingShortcut(Modifier.weight(1f))
                        doubtShortcut(Modifier.weight(1f))
                    }
                }
            }

            // Semester Selector Row (Shared across Study & Exam)
            if (selectedTab != 2) {
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            FilterChip(
                                selected = selectedSemester == 0L,
                                onClick = {
                                    selectedSemester = 0L
                                    examSubmitted = false
                                },
                                label = { Text(t(language, "All Semesters", "সব সেমিস্টার")) },
                                modifier = Modifier.testTag("student_sem_all")
                            )
                        }
                        items((1L..8L).toList()) { sem ->
                            FilterChip(
                                selected = selectedSemester == sem,
                                onClick = {
                                    selectedSemester = sem
                                    examSubmitted = false
                                },
                                label = { Text("Sem $sem") },
                                modifier = Modifier.testTag("student_sem_$sem")
                            )
                        }
                    }
                }
            }

            when (selectedTab) {
                // TAB 0: Study Materials
                0 -> {
                    item {
                        val categories = listOf(
                            "ALL" to t(language, "All", "সব"),
                            "NOTES_PDF" to t(language, "PDF Notes", "PDF নোটস"),
                            "VIDEO_LECTURE" to t(language, "Videos", "ভিডিও"),
                            "PYQ" to t(language, "PYQs", "পূর্ববর্তী প্রশ্ন"),
                            "PRACTICAL" to t(language, "Practicals", "প্র্যাকটিক্যাল")
                        )
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(categories) { (key, label) ->
                                FilterChip(
                                    selected = selectedCategory == key,
                                    onClick = { selectedCategory = key },
                                    label = { Text(label) },
                                    modifier = Modifier.testTag("student_cat_$key")
                                )
                            }
                        }
                    }

                    when (studyMaterialsState) {
                        UiState.Loading -> item {
                            Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        }
                        is UiState.Error -> item {
                            ErrorBannerCard(message = studyMaterialsState.message)
                        }
                        is UiState.Success -> {
                            val filtered = studyMaterialsState.data.filter { mat ->
                                (selectedSemester == 0L || mat.semester == selectedSemester) &&
                                    (selectedCategory == "ALL" || mat.category == selectedCategory)
                            }
                            if (filtered.isEmpty()) {
                                item {
                                    EmptyStateCard(
                                        title = t(language, "No Study Materials Published Yet", "এখনো কোনো স্টাডি ম্যাটেরিয়াল নেই"),
                                        description = t(
                                            language,
                                            "Administrators can publish semester-wise B.Sc Agriculture notes, video lectures, PYQs, and practical manuals from the Central Admin Dashboard.",
                                            "অ্যাডমিন ড্যাশবোর্ড থেকে সেমিস্টার অনুযায়ী নোটস, ভিডিও ও প্র্যাকটিক্যাল প্রকাশ করা হলে এখানে দেখা যাবে।"
                                        ),
                                        icon = Icons.Filled.MenuBook
                                    )
                                }
                            } else {
                                val displayedMaterials = filtered.take(visibleMaterialCount)
                                if (metrics.gridColumns > 1) {
                                    items(
                                        items = displayedMaterials.chunked(metrics.gridColumns),
                                        key = { row -> row.joinToString("_") { it.id } }
                                    ) { rowMaterials ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                                            verticalAlignment = Alignment.Top
                                        ) {
                                            rowMaterials.forEach { mat ->
                                                Box(modifier = Modifier.weight(1f)) {
                                                    StudyMaterialCard(
                                                        material = mat,
                                                        language = language,
                                                        onOpenResource = { openExternalUrl(context, mat.resourceUrl) }
                                                    )
                                                }
                                            }
                                            if (rowMaterials.size < metrics.gridColumns) {
                                                Spacer(modifier = Modifier.weight(1f))
                                            }
                                        }
                                    }
                                } else {
                                    items(displayedMaterials, key = { it.id }) { mat ->
                                        StudyMaterialCard(
                                            material = mat,
                                            language = language,
                                            onOpenResource = { openExternalUrl(context, mat.resourceUrl) }
                                        )
                                    }
                                }
                                if (filtered.size > visibleMaterialCount) {
                                    item {
                                        OutlinedButton(
                                            onClick = { visibleMaterialCount += 20 },
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .heightIn(min = 48.dp)
                                                .testTag("student_load_more_materials")
                                        ) {
                                            Text(
                                                t(
                                                    language,
                                                    "Load more study materials (${filtered.size - visibleMaterialCount} more)",
                                                    "আরও স্টাডি ম্যাটেরিয়াল দেখুন (আরও ${filtered.size - visibleMaterialCount} টি)"
                                                )
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 1: Interactive MCQ Exam
                1 -> {
                    when (quizzesState) {
                        UiState.Loading -> item {
                            Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        }
                        is UiState.Error -> item {
                            ErrorBannerCard(message = quizzesState.message)
                        }
                        is UiState.Success -> {
                            val filteredQuizzes = quizzesState.data.filter { q ->
                                selectedSemester == 0L || q.semester == selectedSemester
                            }
                            if (filteredQuizzes.isEmpty()) {
                                item {
                                    EmptyStateCard(
                                        title = t(language, "No MCQ Exam Questions Available", "এই সেমিস্টারে কোনো MCQ প্রশ্ন নেই"),
                                        description = t(
                                            language,
                                            "Try switching to 'All Semesters' or publish starter B.Sc Agriculture MCQs from the Admin Dashboard.",
                                            "'সব সেমিস্টার' নির্বাচন করুন অথবা অ্যাডমিন ড্যাশবোর্ড থেকে MCQ যোগ করুন।"
                                        ),
                                        icon = Icons.Filled.Quiz
                                    )
                                }
                            } else {
                                items(filteredQuizzes, key = { it.id }) { q ->
                                    val chosen = selectedAnswers[q.id]
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = MaterialTheme.shapes.medium,
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(16.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            FlowRow(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                StatusPill(
                                                    label = "Sem ${q.semester} • ${q.subject}",
                                                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                                                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                                )
                                                if (examSubmitted && chosen != null) {
                                                    val isRight = chosen.toLong() == q.correctIndex
                                                    StatusPill(
                                                        label = if (isRight) "Correct" else "Review",
                                                        containerColor = if (isRight) Color(0xFFD8F3DC) else MaterialTheme.colorScheme.errorContainer,
                                                        contentColor = if (isRight) Color(0xFF14532D) else MaterialTheme.colorScheme.error
                                                    )
                                                }
                                            }
                                            Text(
                                                text = q.questionText,
                                                style = MaterialTheme.typography.titleSmall,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            q.options.forEachIndexed { idx, opt ->
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .clip(RoundedCornerShape(10.dp))
                                                        .clickable(enabled = !examSubmitted) {
                                                            selectedAnswers[q.id] = idx
                                                        }
                                                        .minimumInteractiveComponentSize()
                                                        .padding(end = 8.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    RadioButton(
                                                        selected = chosen == idx,
                                                        onClick = {
                                                            if (!examSubmitted) selectedAnswers[q.id] = idx
                                                        },
                                                        modifier = Modifier.testTag("quiz_${q.id}_opt_$idx")
                                                    )
                                                    Text(
                                                        text = opt,
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        color = if (examSubmitted && idx.toLong() == q.correctIndex) {
                                                            MaterialTheme.colorScheme.primary
                                                        } else {
                                                            MaterialTheme.colorScheme.onSurface
                                                        },
                                                        fontWeight = if (examSubmitted && idx.toLong() == q.correctIndex) {
                                                            FontWeight.Bold
                                                        } else FontWeight.Normal,
                                                        modifier = Modifier.weight(1f)
                                                    )
                                                }
                                            }
                                            if (examSubmitted && q.explanation.isNotBlank()) {
                                                Text(
                                                    text = "${t(language, "Explanation", "ব্যাখ্যা")}: ${q.explanation}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                            }
                                        }
                                    }
                                }

                                item {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Button(
                                            onClick = {
                                                val score = filteredQuizzes.count { q ->
                                                    selectedAnswers[q.id]?.toLong() == q.correctIndex
                                                }.toLong()
                                                examSubmitted = true
                                                val sem = selectedSemester.takeIf { it in 1L..8L } ?: filteredQuizzes.first().semester
                                                onSubmitQuizAttempt(sem, score, filteredQuizzes.size.toLong())
                                            },
                                            enabled = !examSubmitted && selectedAnswers.isNotEmpty(),
                                            modifier = Modifier
                                                .weight(1f)
                                                .heightIn(min = 48.dp)
                                                .testTag("submit_mcq_exam_button")
                                        ) {
                                            Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                text = t(language, "Submit & Save Score", "জমা দিন ও স্কোর সেভ করুন"),
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                        if (examSubmitted) {
                                            OutlinedButton(
                                                onClick = {
                                                    selectedAnswers.clear()
                                                    examSubmitted = false
                                                },
                                                modifier = Modifier
                                                    .heightIn(min = 48.dp)
                                                    .testTag("retake_mcq_exam_button")
                                            ) {
                                                Text(t(language, "Retake", "আবার দিন"))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 2: My Exam History
                2 -> {
                    when (attemptsState) {
                        UiState.Loading -> item {
                            Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        }
                        is UiState.Error -> item { ErrorBannerCard(attemptsState.message) }
                        is UiState.Success -> {
                            if (attemptsState.data.isEmpty()) {
                                item {
                                    EmptyStateCard(
                                        title = t(language, "No Exam Attempts Yet", "এখনো কোনো পরীক্ষা দেওয়া হয়নি"),
                                        description = t(
                                            language,
                                            "Complete an MCQ exam in the MCQ Exam tab to track your B.Sc Agriculture progress privately.",
                                            "আপনার প্রস্তুতি ট্র্যাক করতে MCQ পরীক্ষা ট্যাবে একটি পরীক্ষা দিন।"
                                        ),
                                        icon = Icons.Filled.Quiz
                                    )
                                }
                            } else {
                                items(attemptsState.data, key = { it.id }) { attempt ->
                                    val pct = ((attempt.score * 100) / attempt.totalQuestions.coerceAtLeast(1L)).toInt()
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = MaterialTheme.shapes.medium,
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(16.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(
                                                    text = "Semester ${attempt.semester} MCQ Exam",
                                                    style = MaterialTheme.typography.titleSmall
                                                )
                                                Text(
                                                    text = "Score: ${attempt.score} / ${attempt.totalQuestions}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                            StatusPill(
                                                label = "$pct%",
                                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                                contentColor = MaterialTheme.colorScheme.onPrimaryContainer
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

@Composable
private fun StudyMaterialCard(
    material: StudyMaterial,
    language: AppLanguage,
    onOpenResource: () -> Unit
) {
    val icon = when (material.category) {
        "VIDEO_LECTURE" -> Icons.Filled.PlayCircleOutline
        "PRACTICAL" -> Icons.Filled.Science
        else -> Icons.Filled.MenuBook
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.55f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatusPill(
                    label = "Sem ${material.semester} • ${material.category.replace('_', ' ')}",
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Icon(
                    imageVector = icon,
                    contentDescription = material.category,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(22.dp)
                )
            }
            Text(
                text = material.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = material.subject,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.secondary
            )
            Text(
                text = material.summary,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (material.resourceUrl.isNotBlank()) {
                OutlinedButton(
                    onClick = onOpenResource,
                    modifier = Modifier.testTag("open_material_${material.id}")
                ) {
                    Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(t(language, "Open Resource", "রিসোর্স খুলুন"))
                }
            }
        }
    }
}
