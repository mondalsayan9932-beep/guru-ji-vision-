package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.AutoFixHigh
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.data.model.AppSettings
import com.example.data.model.ProfessorProfile
import com.example.data.model.UiState
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.viewmodel.AdminViewModel

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AdminDashboardScreen(
    isFounder: Boolean,
    language: AppLanguage,
    appSettings: AppSettings,
    adminViewModel: AdminViewModel?,
    onBack: () -> Unit
) {
    if (!isFounder || adminViewModel == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                EmptyStateCard(
                    title = t(language, "Founder / Owner Access Only", "শুধুমাত্র ফাউন্ডার / ওনার অ্যাক্সেস"),
                    description = t(
                        language,
                        "Access to the Admin Dashboard is strictly restricted to the verified Guru Ji Vision Founder / Owner account.",
                        "অ্যাডমিন ড্যাশবোর্ড শুধুমাত্র ভেরিফাইড গুরু জি ভিশন ফাউন্ডার অ্যাকাউন্টের জন্য সংরক্ষিত।"
                    ),
                    icon = Icons.Filled.Security
                )
                OutlinedButton(
                    onClick = onBack,
                    modifier = Modifier.testTag("admin_restricted_back_button")
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(t(language, "Return to Home", "হোমে ফিরে যান"))
                }
            }
        }
        return
    }

    val allUsersState by adminViewModel.allUsers.collectAsStateWithLifecycle()
    val allQueriesState by adminViewModel.allFarmerQueries.collectAsStateWithLifecycle()
    val allMaterialsState by adminViewModel.allStudyMaterials.collectAsStateWithLifecycle()
    val allQuizzesState by adminViewModel.allQuizzes.collectAsStateWithLifecycle()
    val allCareersState by adminViewModel.allCareers.collectAsStateWithLifecycle()
    val allPostsState by adminViewModel.allCommunityPosts.collectAsStateWithLifecycle()
    val allNoticesState by adminViewModel.allAnnouncements.collectAsStateWithLifecycle()
    val adminsState by adminViewModel.adminRecords.collectAsStateWithLifecycle()
    val auditLogsState by adminViewModel.auditLogs.collectAsStateWithLifecycle()
    val allProfessorsState by adminViewModel.allProfessors.collectAsStateWithLifecycle()
    val allAiUsageLogsState by adminViewModel.allAiUsageLogs.collectAsStateWithLifecycle()
    val aiConnectionTestState by adminViewModel.aiConnectionTestState.collectAsStateWithLifecycle()
    val pdfExtracting by adminViewModel.pdfExtracting.collectAsStateWithLifecycle()
    val banner by adminViewModel.statusBanner.collectAsStateWithLifecycle()
    val busy by adminViewModel.busy.collectAsStateWithLifecycle()

    var editingProfessor by remember { mutableStateOf<ProfessorProfile?>(null) }

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf(
        t(language, "Overview", "সারসংক্ষেপ"),
        t(language, "Farmer Desk", "কৃষক প্রশ্ন"),
        t(language, "Academics", "শিক্ষা ও MCQ"),
        t(language, "Careers & Notices", "ক্যারিয়ার ও নোটিশ"),
        t(language, "Users & Settings", "ইউজার ও সেটিংস"),
        t(language, "Faculty / Professors", "অধ্যাপক পরিচালনা"),
        t(language, "AI Guru", "এআই গুরু")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Admin Header Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.primary)
                .padding(horizontal = 8.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.testTag("admin_back_button")
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Icon(Icons.Filled.AdminPanelSettings, contentDescription = null, tint = Color.White)
            Spacer(Modifier.width(8.dp))
            Column {
                Text(
                    text = L10n.adminDashboard(language),
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
                Text(
                    text = "Verified Founder / Owner Exclusive Console",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White.copy(alpha = 0.85f)
                )
            }
        }

        ScrollableTabRow(selectedTabIndex = selectedTab, edgePadding = 12.dp) {
            tabs.forEachIndexed { idx, label ->
                Tab(
                    selected = selectedTab == idx,
                    onClick = { selectedTab = idx },
                    text = { Text(label) },
                    modifier = Modifier.testTag("admin_tab_$idx")
                )
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (banner != null) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(banner!!, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                            OutlinedButton(onClick = { adminViewModel.clearBanner() }) { Text("OK") }
                        }
                    }
                }
            }

            when (selectedTab) {
                // TAB 0: OVERVIEW & STARTER CURRICULUM PUBLISHER
                0 -> {
                    val userCount = (allUsersState as? UiState.Success)?.data?.size ?: 0
                    val studentCount = (allUsersState as? UiState.Success)?.data?.count { it.role == "STUDENT" } ?: 0
                    val farmerCount = (allUsersState as? UiState.Success)?.data?.count { it.role == "FARMER" } ?: 0
                    val openQueries = (allQueriesState as? UiState.Success)?.data?.count { it.status != "RESOLVED" } ?: 0
                    val totalMaterials = (allMaterialsState as? UiState.Success)?.data?.size ?: 0
                    val totalQuizzes = (allQuizzesState as? UiState.Success)?.data?.size ?: 0
                    val totalCareers = (allCareersState as? UiState.Success)?.data?.size ?: 0
                    val totalPosts = (allPostsState as? UiState.Success)?.data?.size ?: 0

                    item {
                        SectionHeader(
                            title = "Live Firestore Platform Metrics",
                            subtitle = "Real-time counts directly from Cloud Firestore (zero synthetic metrics)"
                        )
                    }

                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                AdminMetricTile("Total Users", "$userCount ($studentCount Stu / $farmerCount Farm)", Modifier.weight(1f))
                                AdminMetricTile("Open Farmer Queries", "$openQueries", Modifier.weight(1f))
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                AdminMetricTile("Study Materials", "$totalMaterials", Modifier.weight(1f))
                                AdminMetricTile("MCQ Bank", "$totalQuizzes", Modifier.weight(1f))
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                AdminMetricTile("Career Listings", "$totalCareers", Modifier.weight(1f))
                                AdminMetricTile("Community Posts", "$totalPosts", Modifier.weight(1f))
                            }
                        }
                    }

                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.medium,
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.7f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = "Bootstrap ICAR B.Sc Agriculture Content",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = "Publish verified starter B.Sc Agriculture notes, Soil Science practical manual, MCQ quiz questions, IBPS AFO / ICAR JRF career listings, welcome announcement, and global settings directly to Firestore.",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Button(
                                    onClick = { adminViewModel.publishStarterCurriculum() },
                                    enabled = !busy,
                                    modifier = Modifier.fillMaxWidth().testTag("admin_publish_starter_button")
                                ) {
                                    if (busy) {
                                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                                    } else {
                                        Icon(Icons.Filled.AutoFixHigh, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Publish Starter Curriculum & Settings")
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 1: FARMER QUERY MANAGEMENT
                1 -> {
                    item {
                        SectionHeader("Farmer Query Triage & Resolution", "Reply and update OPEN / IN_REVIEW / RESOLVED statuses")
                    }
                    when (val state = allQueriesState) {
                        UiState.Loading -> item { CircularProgressIndicator() }
                        is UiState.Error -> item { ErrorBannerCard(state.message) }
                        is UiState.Success -> {
                            if (state.data.isEmpty()) {
                                item { EmptyStateCard("No Farmer Queries Yet", "Submitted farmer queries will appear here for expert resolution.") }
                            } else {
                                items(state.data, key = { it.id }) { q ->
                                    var replyText by remember(q.id, q.adminReply) { mutableStateOf(q.adminReply) }
                                    var nextStatus by remember(q.id, q.status) { mutableStateOf(q.status) }
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(14.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text("${q.cropName} — ${q.farmerName}", style = MaterialTheme.typography.titleSmall)
                                                StatusPill(q.status, MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.onPrimaryContainer)
                                            }
                                            Text("${q.category} • ${q.district}", style = MaterialTheme.typography.labelSmall)
                                            Text(q.description, style = MaterialTheme.typography.bodySmall)
                                            if (q.imageSummary.isNotBlank()) {
                                                Text("AI Photo Note: ${q.imageSummary}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                            }
                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                listOf("OPEN", "IN_REVIEW", "RESOLVED").forEach { st ->
                                                    FilterChip(
                                                        selected = nextStatus == st,
                                                        onClick = { nextStatus = st },
                                                        label = { Text(st) }
                                                    )
                                                }
                                            }
                                            OutlinedTextField(
                                                value = replyText,
                                                onValueChange = { replyText = it },
                                                label = { Text("Agronomist Expert Reply") },
                                                minLines = 2,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                            Button(
                                                onClick = { adminViewModel.replyToFarmerQuery(q.id, nextStatus, replyText) },
                                                enabled = !busy,
                                                modifier = Modifier.testTag("admin_reply_query_${q.id}")
                                            ) {
                                                Text("Update Query")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 2: STUDY MATERIALS & MCQ MANAGEMENT
                2 -> {
                    item {
                        var matTitle by remember { mutableStateOf("") }
                        var matSubject by remember { mutableStateOf("") }
                        var matSem by remember { mutableLongStateOf(1L) }
                        var matCat by remember { mutableStateOf("NOTES_PDF") }
                        var matSummary by remember { mutableStateOf("") }
                        var matUrl by remember { mutableStateOf("") }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Add Study Material (PDF / Video / PYQ / Practical)", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(matTitle, { matTitle = it }, label = { Text("Material Title") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(matSubject, { matSubject = it }, label = { Text("Subject (e.g. Agronomy)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    (1L..8L).forEach { s ->
                                        FilterChip(selected = matSem == s, onClick = { matSem = s }, label = { Text("S$s") })
                                    }
                                }
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    listOf("NOTES_PDF", "VIDEO_LECTURE", "PYQ", "PRACTICAL").forEach { c ->
                                        FilterChip(selected = matCat == c, onClick = { matCat = c }, label = { Text(c) })
                                    }
                                }
                                OutlinedTextField(matSummary, { matSummary = it }, label = { Text("Summary") }, minLines = 2, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(matUrl, { matUrl = it }, label = { Text("Resource URL (PDF / YouTube)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                Button(
                                    onClick = {
                                        adminViewModel.addStudyMaterial(matTitle, matSem, matSubject, matCat, matSummary, matUrl) {
                                            matTitle = ""; matSubject = ""; matSummary = ""; matUrl = ""
                                        }
                                    },
                                    enabled = !busy && matTitle.trim().length >= 2 && matSubject.trim().length >= 2 && matSummary.trim().length >= 5,
                                    modifier = Modifier.fillMaxWidth().testTag("admin_add_material_button")
                                ) { Text("Publish Study Material") }
                            }
                        }
                    }

                    item {
                        var qTitle by remember { mutableStateOf("") }
                        var qSubject by remember { mutableStateOf("") }
                        var qSem by remember { mutableLongStateOf(1L) }
                        var qText by remember { mutableStateOf("") }
                        var opt0 by remember { mutableStateOf("") }
                        var opt1 by remember { mutableStateOf("") }
                        var opt2 by remember { mutableStateOf("") }
                        var opt3 by remember { mutableStateOf("") }
                        var correctIdx by remember { mutableLongStateOf(0L) }
                        var explanation by remember { mutableStateOf("") }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Add Online Exam MCQ", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(qTitle, { qTitle = it }, label = { Text("MCQ Set Title") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(qSubject, { qSubject = it }, label = { Text("Subject") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    (1L..8L).forEach { s -> FilterChip(selected = qSem == s, onClick = { qSem = s }, label = { Text("S$s") }) }
                                }
                                OutlinedTextField(qText, { qText = it }, label = { Text("Question") }, minLines = 2, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(opt0, { opt0 = it }, label = { Text("Option A") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(opt1, { opt1 = it }, label = { Text("Option B") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(opt2, { opt2 = it }, label = { Text("Option C") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(opt3, { opt3 = it }, label = { Text("Option D") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    listOf(0L to "A", 1L to "B", 2L to "C", 3L to "D").forEach { (idx, lbl) ->
                                        FilterChip(selected = correctIdx == idx, onClick = { correctIdx = idx }, label = { Text("Ans: $lbl") })
                                    }
                                }
                                OutlinedTextField(explanation, { explanation = it }, label = { Text("Explanation") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                Button(
                                    onClick = {
                                        adminViewModel.addQuizQuestion(
                                            qTitle, qSem, qSubject, qText, listOf(opt0, opt1, opt2, opt3), correctIdx, explanation
                                        ) {
                                            qTitle = ""; qSubject = ""; qText = ""; opt0 = ""; opt1 = ""; opt2 = ""; opt3 = ""; explanation = ""
                                        }
                                    },
                                    enabled = !busy && qTitle.length >= 2 && qText.length >= 5 && listOf(opt0, opt1, opt2, opt3).all { it.isNotBlank() },
                                    modifier = Modifier.fillMaxWidth().testTag("admin_add_mcq_button")
                                ) { Text("Publish MCQ") }
                            }
                        }
                    }

                    // Existing Materials list with Delete
                    if (allMaterialsState is UiState.Success) {
                        items((allMaterialsState as UiState.Success).data, key = { "m_${it.id}" }) { mat ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(Modifier.weight(1f)) {
                                        Text(mat.title, style = MaterialTheme.typography.titleSmall)
                                        Text("Sem ${mat.semester} • ${mat.subject} • ${mat.category}", style = MaterialTheme.typography.labelSmall)
                                    }
                                    IconButton(onClick = { adminViewModel.deleteStudyMaterial(mat.id) }) {
                                        Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete material")
                                    }
                                }
                            }
                        }
                    }
                    if (allQuizzesState is UiState.Success) {
                        items((allQuizzesState as UiState.Success).data, key = { "q_${it.id}" }) { q ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(Modifier.weight(1f)) {
                                        Text(q.questionText, style = MaterialTheme.typography.bodySmall, maxLines = 2)
                                        Text("Sem ${q.semester} • ${q.subject}", style = MaterialTheme.typography.labelSmall)
                                    }
                                    IconButton(onClick = { adminViewModel.deleteQuizQuestion(q.id) }) {
                                        Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete MCQ")
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 3: CAREERS & BROADCAST NOTIFICATIONS
                3 -> {
                    item {
                        var cTitle by remember { mutableStateOf("") }
                        var cOrg by remember { mutableStateOf("") }
                        var cCat by remember { mutableStateOf("GOVT_JOB") }
                        var cElig by remember { mutableStateOf("B.Sc (Hons.) Agriculture") }
                        var cDead by remember { mutableStateOf("") }
                        var cDesc by remember { mutableStateOf("") }
                        var cUrl by remember { mutableStateOf("") }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Publish Career / Scholarship / Exam Update", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(cTitle, { cTitle = it }, label = { Text("Opportunity Title") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(cOrg, { cOrg = it }, label = { Text("Organization") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    listOf("GOVT_JOB", "PRIVATE_JOB", "SCHOLARSHIP", "INTERNSHIP", "COMPETITIVE_EXAM").forEach { cat ->
                                        FilterChip(selected = cCat == cat, onClick = { cCat = cat }, label = { Text(cat) })
                                    }
                                }
                                OutlinedTextField(cElig, { cElig = it }, label = { Text("Eligibility") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(cDead, { cDead = it }, label = { Text("Deadline") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(cDesc, { cDesc = it }, label = { Text("Description") }, minLines = 2, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(cUrl, { cUrl = it }, label = { Text("Apply URL") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                Button(
                                    onClick = {
                                        adminViewModel.addCareer(cTitle, cOrg, cCat, cElig, cDead, cDesc, cUrl) {
                                            cTitle = ""; cOrg = ""; cDead = ""; cDesc = ""; cUrl = ""
                                        }
                                    },
                                    enabled = !busy && cTitle.length >= 2 && cOrg.length >= 2,
                                    modifier = Modifier.fillMaxWidth().testTag("admin_add_career_button")
                                ) { Text("Publish Career Update") }
                            }
                        }
                    }

                    item {
                        var nTitle by remember { mutableStateOf("") }
                        var nMsg by remember { mutableStateOf("") }
                        var nAud by remember { mutableStateOf("ALL") }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Broadcast Platform Announcement", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(nTitle, { nTitle = it }, label = { Text("Notice Title") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(nMsg, { nMsg = it }, label = { Text("Message") }, minLines = 2, modifier = Modifier.fillMaxWidth())
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    listOf("ALL", "STUDENTS", "FARMERS").forEach { a ->
                                        FilterChip(selected = nAud == a, onClick = { nAud = a }, label = { Text(a) })
                                    }
                                }
                                Button(
                                    onClick = {
                                        adminViewModel.addAnnouncement(nTitle, nMsg, nAud) {
                                            nTitle = ""; nMsg = ""
                                        }
                                    },
                                    enabled = !busy && nTitle.length >= 2 && nMsg.length >= 3,
                                    modifier = Modifier.fillMaxWidth().testTag("admin_add_notice_button")
                                ) { Text("Broadcast Notice") }
                            }
                        }
                    }

                    if (allNoticesState is UiState.Success) {
                        items((allNoticesState as UiState.Success).data, key = { "n_${it.id}" }) { n ->
                            Card(Modifier.fillMaxWidth()) {
                                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(n.title, style = MaterialTheme.typography.titleSmall)
                                        Text("${n.audience} • ${n.message}", style = MaterialTheme.typography.bodySmall)
                                    }
                                    IconButton(onClick = { adminViewModel.deleteAnnouncement(n.id) }) {
                                        Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete notice")
                                    }
                                }
                            }
                        }
                    }
                    if (allCareersState is UiState.Success) {
                        items((allCareersState as UiState.Success).data, key = { "c_${it.id}" }) { c ->
                            Card(Modifier.fillMaxWidth()) {
                                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(c.title, style = MaterialTheme.typography.titleSmall)
                                        Text("${c.organization} • ${c.category}", style = MaterialTheme.typography.labelSmall)
                                    }
                                    IconButton(onClick = { adminViewModel.deleteCareer(c.id) }) {
                                        Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete career")
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 4: USERS, MODERATION, STAFF ROLES & WHATSAPP / SITE SETTINGS
                4 -> {
                    item {
                        var waNumber by remember(appSettings.whatsappNumber) { mutableStateOf(appSettings.whatsappNumber) }
                        var waGroupUrl by remember(appSettings.whatsappGroupInviteUrl) { mutableStateOf(appSettings.whatsappGroupInviteUrl) }
                        var supEmail by remember(appSettings.supportEmail) { mutableStateOf(appSettings.supportEmail) }
                        var headline by remember(appSettings.heroHeadline) { mutableStateOf(appSettings.heroHeadline) }
                        var about by remember(appSettings.aboutText) { mutableStateOf(appSettings.aboutText) }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("WhatsApp Support & Website/App Content Settings", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(
                                    value = waGroupUrl,
                                    onValueChange = { waGroupUrl = it },
                                    label = { Text("Official WhatsApp Group Invite URL") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth().testTag("admin_wa_group_url_input")
                                )
                                OutlinedTextField(waNumber, { waNumber = it }, label = { Text("WhatsApp Desk Contact Number (+91...)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(supEmail, { supEmail = it }, label = { Text("Support Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(headline, { headline = it }, label = { Text("Home Hero Headline") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(about, { about = it }, label = { Text("About Guru Ji Vision") }, minLines = 3, modifier = Modifier.fillMaxWidth())
                                Button(
                                    onClick = {
                                        adminViewModel.saveSettings(
                                            whatsapp = waNumber,
                                            whatsappGroupUrl = waGroupUrl,
                                            email = supEmail,
                                            about = about,
                                            headline = headline,
                                            currentSettings = appSettings
                                        )
                                    },
                                    enabled = !busy,
                                    modifier = Modifier.fillMaxWidth().testTag("admin_save_settings_button")
                                ) { Text("Save Global Settings") }
                            }
                        }
                    }

                    // Staff Role Assignment
                    item {
                        var staffUid by remember { mutableStateOf("") }
                        var staffEmail by remember { mutableStateOf("") }
                        var staffRole by remember { mutableStateOf("Content Moderator") }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Admin & Staff Role Permissions", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(staffUid, { staffUid = it }, label = { Text("Target User UID (from User Directory below)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(staffEmail, { staffEmail = it }, label = { Text("Staff Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(staffRole, { staffRole = it }, label = { Text("Role Title (e.g. Agronomist, Moderator)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                Button(
                                    onClick = {
                                        adminViewModel.addStaffAdmin(staffUid, staffEmail, staffRole) {
                                            staffUid = ""; staffEmail = ""
                                        }
                                    },
                                    enabled = !busy && staffUid.isNotBlank() && staffEmail.isNotBlank(),
                                    modifier = Modifier.fillMaxWidth().testTag("admin_grant_staff_button")
                                ) { Text("Grant Admin Staff Role") }
                            }
                        }
                    }

                    if (adminsState is UiState.Success && (adminsState as UiState.Success).data.isNotEmpty()) {
                        items((adminsState as UiState.Success).data, key = { "adm_${it.id}" }) { adm ->
                            Card(Modifier.fillMaxWidth()) {
                                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text("${adm.email} (${adm.roleTitle})", style = MaterialTheme.typography.titleSmall)
                                        Text("UID: ${adm.id}", style = MaterialTheme.typography.labelSmall)
                                    }
                                    IconButton(onClick = { adminViewModel.removeStaffAdmin(adm.id) }) {
                                        Icon(Icons.Filled.DeleteOutline, contentDescription = "Revoke admin")
                                    }
                                }
                            }
                        }
                    }

                    // Community Moderation
                    item { SectionHeader("Community Post Moderation") }
                    if (allPostsState is UiState.Success) {
                        items((allPostsState as UiState.Success).data, key = { "mod_${it.id}" }) { p ->
                            Card(Modifier.fillMaxWidth()) {
                                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(p.title, style = MaterialTheme.typography.titleSmall)
                                        Text("${p.authorName} • ${p.status}", style = MaterialTheme.typography.labelSmall)
                                    }
                                    val toggleTo = if (p.status == "ACTIVE") "HIDDEN" else "ACTIVE"
                                    OutlinedButton(onClick = { adminViewModel.moderatePost(p.id, toggleTo) }) {
                                        Text(if (toggleTo == "HIDDEN") "Hide" else "Restore")
                                    }
                                }
                            }
                        }
                    }

                    // User Directory (Students & Farmers)
                    item { SectionHeader("Registered Users Directory") }
                    if (allUsersState is UiState.Success) {
                        items((allUsersState as UiState.Success).data, key = { "u_${it.id}" }) { u ->
                            Card(Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text("${u.displayName} (${u.role})", style = MaterialTheme.typography.titleSmall)
                                    Text("${u.email} • ${u.institutionOrVillage} • ${u.district}", style = MaterialTheme.typography.bodySmall)
                                    Text("UID: ${u.userId}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }

                    // Immutable Administrative Audit Log
                    item {
                        SectionHeader(
                            title = "Immutable Administrative Audit Log",
                            subtitle = "Append-only security record of Founder actions (cannot be edited or deleted)"
                        )
                    }
                    when (val auditState = auditLogsState) {
                        UiState.Loading -> item { CircularProgressIndicator() }
                        is UiState.Error -> item { ErrorBannerCard(auditState.message) }
                        is UiState.Success -> {
                            if (auditState.data.isEmpty()) {
                                item {
                                    EmptyStateCard(
                                        title = "No Administrative Actions Logged Yet",
                                        description = "Every settings update, content publication, query reply, and moderation action is permanently recorded here."
                                    )
                                }
                            } else {
                                items(auditState.data.take(20), key = { "audit_${it.id}" }) { log ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                                    ) {
                                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(log.action.replace('_', ' '), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                                                StatusPill(
                                                    label = log.targetType,
                                                    containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                                    contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                                )
                                            }
                                            if (log.summary.isNotBlank()) {
                                                Text(log.summary, style = MaterialTheme.typography.bodySmall)
                                            }
                                            Text(
                                                text = "Actor: ${log.actorEmail.ifBlank { log.actorUid }}",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 5: FACULTY / PROFESSORS DIRECTORY & PERMISSIONS
                5 -> {
                    item {
                        SectionHeader(
                            title = t(language, "Faculty Directory & Doubt Zone Permissions", "অধ্যাপক তালিকা ও অনুমতি"),
                            subtitle = t(
                                language,
                                "Manage professor profiles, Meeting Zone host rights, and Google UID account links",
                                "অধ্যাপকদের প্রোফাইল, মিটিং হোস্ট অনুমতি এবং Google UID লিঙ্ক পরিচালনা করুন"
                            )
                        )
                    }

                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.55f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Lock,
                                    contentDescription = "Private Chat Protection",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Privacy Guarantee: Admin manages professor profiles and account permissions here, but cannot view or read private student–professor Doubt Zone conversations.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { adminViewModel.syncDefaultProfessors() },
                                enabled = !busy,
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("admin_sync_professors_button")
                            ) {
                                Icon(Icons.Filled.Sync, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Sync 9 Official Faculty", maxLines = 1)
                            }
                            OutlinedButton(
                                onClick = {
                                    editingProfessor = ProfessorProfile(
                                        id = "",
                                        name = "",
                                        designation = "Assistant Professor",
                                        department = "Biological Science",
                                        active = true,
                                        canHostMeetings = true,
                                        displayOrder = (((allProfessorsState as? UiState.Success)?.data?.size ?: 9) + 1).toLong()
                                    )
                                },
                                enabled = !busy,
                                modifier = Modifier.testTag("admin_add_professor_button")
                            ) {
                                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Add")
                            }
                        }
                    }

                    when (val profState = allProfessorsState) {
                        UiState.Loading -> item { CircularProgressIndicator() }
                        is UiState.Error -> item { ErrorBannerCard(profState.message) }
                        is UiState.Success -> {
                            items(profState.data, key = { "prof_${it.id}" }) { prof ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("admin_prof_card_${prof.id}"),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                                ) {
                                    Column(
                                        modifier = Modifier.padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(prof.name, style = MaterialTheme.typography.titleSmall)
                                                Text(
                                                    buildString {
                                                        append(prof.designation)
                                                        if (prof.qualification.isNotBlank()) append(" • ${prof.qualification}")
                                                    },
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                            OutlinedButton(
                                                onClick = { editingProfessor = prof },
                                                modifier = Modifier.testTag("admin_edit_prof_${prof.id}")
                                            ) {
                                                Icon(Icons.Filled.Edit, contentDescription = "Edit professor", modifier = Modifier.size(16.dp))
                                                Spacer(Modifier.width(4.dp))
                                                Text("Edit")
                                            }
                                        }
                                        if (prof.specialization.isNotBlank()) {
                                            Text(
                                                text = prof.specialization,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                        val metaLine = buildString {
                                            if (prof.subject.isNotBlank()) append("Subject: ${prof.subject} • ")
                                            append("Dept: ${prof.department}")
                                        }
                                        Text(metaLine, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(
                                            text = if (prof.email.isNotBlank()) "Email: ${prof.email}" else "Email: Not listed (link Google UID below if needed)",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        if (prof.authorizedUid.isNotBlank()) {
                                            Text(
                                                text = "Linked Google UID: ${prof.authorizedUid}",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            StatusPill(
                                                label = if (prof.active) "ACTIVE" else "HIDDEN",
                                                containerColor = if (prof.active) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer,
                                                contentColor = if (prof.active) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                                            )
                                            StatusPill(
                                                label = if (prof.canHostMeetings) "CAN HOST MEETINGS" else "MEET HOST OFF",
                                                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                                contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 6: AI GURU FREE-TIER SETTINGS & KNOWLEDGE BASE UPLOAD
                6 -> {
                    item {
                        AdminAiGuruPanel(
                            language = language,
                            appSettings = appSettings,
                            aiUsageLogsState = allAiUsageLogsState,
                            studyMaterialsState = allMaterialsState,
                            connectionTestState = aiConnectionTestState,
                            pdfExtracting = pdfExtracting,
                            busy = busy,
                            onTestConnection = { modelName ->
                                adminViewModel.testAiGuruConnection(modelName)
                            },
                            onSaveAiSettings = { enabled, modelName, freeSearchEnabled, dailyLimit ->
                                adminViewModel.saveAiGuruSettings(
                                    currentSettings = appSettings,
                                    enabled = enabled,
                                    modelName = modelName,
                                    freeSearchEnabled = freeSearchEnabled,
                                    dailyLimitPerUser = dailyLimit
                                )
                            },
                            onExtractPdfNotes = { bytes, fileName, modelName, onExtracted ->
                                adminViewModel.extractPdfForKnowledgeBase(bytes, fileName, modelName, onExtracted)
                            },
                            onPublishKnowledgeMaterial = { title, sem, subj, cat, sum, url, content, verified, done ->
                                adminViewModel.addStudyMaterial(
                                    title = title,
                                    semester = sem,
                                    subject = subj,
                                    category = cat,
                                    summary = sum,
                                    resourceUrl = url,
                                    contentText = content,
                                    verifiedForAi = verified,
                                    onDone = done
                                )
                            }
                        )
                    }
                }
            }
        }
    }

    editingProfessor?.let { target ->
        AdminProfessorEditorDialog(
            initial = target,
            busy = busy,
            onDismiss = { editingProfessor = null },
            onSave = { updated ->
                adminViewModel.saveProfessorProfile(updated) {
                    editingProfessor = null
                }
            }
        )
    }
}

@Composable
private fun AdminProfessorEditorDialog(
    initial: ProfessorProfile,
    busy: Boolean,
    onDismiss: () -> Unit,
    onSave: (ProfessorProfile) -> Unit
) {
    var name by remember(initial.id) { mutableStateOf(initial.name) }
    var designation by remember(initial.id) { mutableStateOf(initial.designation) }
    var qualification by remember(initial.id) { mutableStateOf(initial.qualification) }
    var subject by remember(initial.id) { mutableStateOf(initial.subject) }
    var department by remember(initial.id) { mutableStateOf(initial.department) }
    var specialization by remember(initial.id) { mutableStateOf(initial.specialization) }
    var email by remember(initial.id) { mutableStateOf(initial.email) }
    var authorizedUid by remember(initial.id) { mutableStateOf(initial.authorizedUid) }
    var canHostMeetings by remember(initial.id) { mutableStateOf(initial.canHostMeetings) }
    var active by remember(initial.id) { mutableStateOf(initial.active) }

    AlertDialog(
        onDismissRequest = { if (!busy) onDismiss() },
        title = {
            Text(
                text = if (initial.id.isBlank()) "Add Faculty Advisor" else "Edit Faculty Profile & Permissions",
                style = MaterialTheme.typography.titleMedium
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(name, { name = it }, label = { Text("Full Name *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(designation, { designation = it }, label = { Text("Designation *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(qualification, { qualification = it }, label = { Text("Qualification (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(subject, { subject = it }, label = { Text("Subject (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(department, { department = it }, label = { Text("Department *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(specialization, { specialization = it }, label = { Text("Specialization / Advisor Role") }, minLines = 2, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(email, { email = it }, label = { Text("Verified Google Email (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    value = authorizedUid,
                    onValueChange = { authorizedUid = it },
                    label = { Text("Authorized Firebase UID (optional)") },
                    supportingText = { Text("Copy UID from Users tab to link faculty accounts without a listed email.") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Allow Creating Google Meet Sessions", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                    Switch(checked = canHostMeetings, onCheckedChange = { canHostMeetings = it })
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Visible in Doubt Zone Directory", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                    Switch(checked = active, onCheckedChange = { active = it })
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        initial.copy(
                            name = name.trim(),
                            designation = designation.trim(),
                            qualification = qualification.trim(),
                            subject = subject.trim(),
                            department = department.trim(),
                            specialization = specialization.trim(),
                            email = email.trim().lowercase(),
                            authorizedUid = authorizedUid.trim(),
                            canHostMeetings = canHostMeetings,
                            active = active
                        )
                    )
                },
                enabled = !busy && name.trim().length >= 2 && designation.trim().length >= 2 && department.trim().length >= 2,
                modifier = Modifier.testTag("admin_save_professor_confirm")
            ) {
                Text("Save Profile")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !busy) { Text("Cancel") }
        }
    )
}

@Composable
private fun AdminMetricTile(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        }
    }
}
