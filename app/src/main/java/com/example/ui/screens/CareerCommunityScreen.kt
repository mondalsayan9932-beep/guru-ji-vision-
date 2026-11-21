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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.core.AppLanguage
import com.example.core.t
import com.example.data.model.CareerOpportunity
import com.example.data.model.CommunityPost
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.openExternalUrl

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CareerCommunityScreen(
    profile: UserProfile?,
    language: AppLanguage,
    careersState: UiState<List<CareerOpportunity>>,
    postsState: UiState<List<CommunityPost>>,
    busy: Boolean,
    onCreatePost: (
        authorName: String,
        collegeGroup: String,
        topic: String,
        title: String,
        body: String,
        onSuccess: () -> Unit
    ) -> Unit,
    onUpvotePost: (String) -> Unit,
    onReportPost: (CommunityPost, String, () -> Unit) -> Unit = { _, _, _ -> }
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) }
    var careerFilter by remember { mutableStateOf("ALL") }
    var showCreatePost by remember { mutableStateOf(false) }
    var reportingPost by remember { mutableStateOf<CommunityPost?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text(t(language, "Career & Exams", "ক্যারিয়ার ও চাকরি")) },
                modifier = Modifier.testTag("cc_tab_career")
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text(t(language, "Community Forum", "কমিউনিটি ফোরাম")) },
                modifier = Modifier.testTag("cc_tab_community")
            )
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (selectedTab == 0) {
                item {
                    SectionHeader(
                        title = t(language, "Agriculture Careers & Scholarships", "কৃষি চাকরি, বৃত্তি ও পরীক্ষা"),
                        subtitle = t(language, "Govt jobs (IBPS AFO, ADO), Private Agri-Tech, ICAR JRF & Internships", "সরকারি ও বেসরকারি কৃষি চাকরি, বৃত্তি এবং ইন্টার্নশিপ")
                    )
                }
                item {
                    val cats = listOf(
                        "ALL" to "All",
                        "GOVT_JOB" to "Govt Jobs",
                        "PRIVATE_JOB" to "Private",
                        "SCHOLARSHIP" to "Scholarships",
                        "INTERNSHIP" to "Internships",
                        "COMPETITIVE_EXAM" to "Exams"
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(cats) { (code, label) ->
                            FilterChip(
                                selected = careerFilter == code,
                                onClick = { careerFilter = code },
                                label = { Text(label) }
                            )
                        }
                    }
                }
                when (careersState) {
                    UiState.Loading -> item {
                        Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is UiState.Error -> item { ErrorBannerCard(careersState.message) }
                    is UiState.Success -> {
                        val filtered = careersState.data.filter {
                            careerFilter == "ALL" || it.category == careerFilter
                        }
                        if (filtered.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    title = t(language, "No Career Alerts Published Yet", "এখনো কোনো ক্যারিয়ার আপডেট নেই"),
                                    description = t(
                                        language,
                                        "Admin-published IBPS AFO, ICAR scholarships, and agri-business opportunities will appear here.",
                                        "অ্যাডমিন দ্বারা প্রকাশিত চাকরি ও বৃত্তির বিজ্ঞপ্তি এখানে দেখা যাবে।"
                                    ),
                                    icon = Icons.Filled.WorkOutline
                                )
                            }
                        } else {
                            items(filtered, key = { it.id }) { career ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = MaterialTheme.shapes.medium,
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            StatusPill(
                                                label = career.category.replace('_', ' '),
                                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                                contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                            )
                                            StatusPill(
                                                label = "Deadline: ${career.deadline}",
                                                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                                contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                        }
                                        Text(career.title, style = MaterialTheme.typography.titleMedium)
                                        Text(
                                            text = "${career.organization} • ${career.eligibility}",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Text(
                                            text = career.description,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        if (career.applyUrl.isNotBlank()) {
                                            OutlinedButton(
                                                onClick = { openExternalUrl(context, career.applyUrl) },
                                                modifier = Modifier.testTag("career_open_${career.id}")
                                            ) {
                                                Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(Modifier.width(6.dp))
                                                Text(t(language, "Official Details", "বিস্তারিত দেখুন"))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // TAB 1: Student & Farmer Community Forum
                item {
                    SectionHeader(
                        title = t(language, "Agri Community & College Groups", "শিক্ষার্থী কমিউনিটি ও কলেজ গ্রুপ"),
                        subtitle = t(language, "Ask doubts, share B.Sc notes & discuss farming innovations", "সন্দেহ নিরসন, নোটস শেয়ার ও কৃষি আলোচনা"),
                        trailing = {
                            Button(
                                onClick = { showCreatePost = true },
                                modifier = Modifier.testTag("community_new_post_button")
                            ) {
                                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(t(language, "Post", "পোস্ট"))
                            }
                        }
                    )
                }

                when (postsState) {
                    UiState.Loading -> item {
                        Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is UiState.Error -> item { ErrorBannerCard(postsState.message) }
                    is UiState.Success -> {
                        if (postsState.data.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    title = t(language, "Start the First Discussion", "প্রথম আলোচনা শুরু করুন"),
                                    description = t(
                                        language,
                                        "Tap 'Post' to ask a B.Sc Agriculture doubt, share semester tips, or connect with students from your college.",
                                        "আপনার প্রশ্ন বা অভিজ্ঞতা শেয়ার করতে 'পোস্ট' বাটনে ট্যাপ করুন।"
                                    ),
                                    icon = Icons.Filled.Forum
                                )
                            }
                        } else {
                            items(postsState.data, key = { it.id }) { post ->
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
                                                label = "${post.topic.replace('_', ' ')} • ${post.collegeGroup}",
                                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                                contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                            )
                                            Text(
                                                text = post.authorName,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Text(post.title, style = MaterialTheme.typography.titleMedium)
                                        Text(
                                            text = post.body,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            TextButton(
                                                onClick = { reportingPost = post },
                                                modifier = Modifier.testTag("post_report_${post.id}")
                                            ) {
                                                Icon(
                                                    Icons.Filled.Flag,
                                                    contentDescription = "Report post",
                                                    modifier = Modifier.size(16.dp),
                                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                                Spacer(Modifier.width(4.dp))
                                                Text(
                                                    t(language, "Report", "রিপোর্ট"),
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                            TextButton(
                                                onClick = { onUpvotePost(post.id) },
                                                modifier = Modifier.testTag("post_helpful_${post.id}")
                                            ) {
                                                Icon(Icons.Filled.ThumbUp, contentDescription = "Helpful", modifier = Modifier.size(16.dp))
                                                Spacer(Modifier.width(6.dp))
                                                Text("${t(language, "Helpful", "সহায়ক")} (${post.helpfulCount})")
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

    if (showCreatePost) {
        var title by remember { mutableStateOf("") }
        var body by remember { mutableStateOf("") }
        var collegeGroup by remember(profile?.institutionOrVillage) {
            mutableStateOf(profile?.institutionOrVillage?.ifBlank { "All India B.Sc Agri" } ?: "All India B.Sc Agri")
        }
        var topic by remember { mutableStateOf("DOUBT") }

        AlertDialog(
            onDismissRequest = { showCreatePost = false },
            title = { Text(t(language, "New Community Post", "নতুন কমিউনিটি পোস্ট")) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("DOUBT", "NOTES_SHARE", "EXAM_PREP", "FARM_TALK").forEach { tp ->
                            FilterChip(
                                selected = topic == tp,
                                onClick = { topic = tp },
                                label = { Text(tp.replace('_', ' ')) }
                            )
                        }
                    }
                    OutlinedTextField(
                        value = collegeGroup,
                        onValueChange = { collegeGroup = it },
                        label = { Text(t(language, "College / Group Name", "কলেজ বা গ্রুপের নাম")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text(t(language, "Question or Discussion Title", "শিরোনাম")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("post_title_input")
                    )
                    OutlinedTextField(
                        value = body,
                        onValueChange = { body = it },
                        label = { Text(t(language, "Details", "বিস্তারিত লিখুন")) },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth().testTag("post_body_input")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCreatePost(
                            profile?.displayName ?: "Member",
                            collegeGroup,
                            topic,
                            title,
                            body
                        ) {
                            showCreatePost = false
                        }
                    },
                    enabled = !busy && title.trim().length >= 3 && body.trim().length >= 5,
                    modifier = Modifier.testTag("post_confirm_button")
                ) {
                    Text(t(language, "Publish", "প্রকাশ করুন"))
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreatePost = false }) {
                    Text(t(language, "Cancel", "বাতিল"))
                }
            }
        )
    }

    val postToReport = reportingPost
    if (postToReport != null) {
        var reason by remember(postToReport.id) { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { reportingPost = null },
            title = { Text(t(language, "Report Community Post", "কমিউনিটি পোস্ট রিপোর্ট করুন")) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = postToReport.title,
                        style = MaterialTheme.typography.labelLarge
                    )
                    OutlinedTextField(
                        value = reason,
                        onValueChange = { reason = it },
                        label = { Text(t(language, "Reason for reporting (spam, unsafe advice, etc.)", "রিপোর্ট করার কারণ")) },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth().testTag("report_reason_input")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onReportPost(postToReport, reason) {
                            reportingPost = null
                        }
                    },
                    enabled = !busy && reason.trim().length >= 3,
                    modifier = Modifier.testTag("report_confirm_button")
                ) {
                    Text(t(language, "Submit Report", "রিপোর্ট পাঠান"))
                }
            },
            dismissButton = {
                TextButton(onClick = { reportingPost = null }) {
                    Text(t(language, "Cancel", "বাতিল"))
                }
            }
        )
    }
}
