package com.example.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.data.model.MeetingSession
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.data.model.isUpcomingMeeting
import com.example.data.model.isValidGoogleMeetUrl
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.StatusPill
import com.example.ui.components.rememberResponsiveMetrics
import com.example.viewmodel.MeetingZoneViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun openGoogleMeetLink(context: Context, meetUrl: String) {
    val cleanUrl = meetUrl.trim()
    if (!isValidGoogleMeetUrl(cleanUrl)) {
        Toast.makeText(context, "Invalid Google Meet link.", Toast.LENGTH_SHORT).show()
        return
    }
    val uri = Uri.parse(cleanUrl)
    val meetIntent = Intent(Intent.ACTION_VIEW, uri).apply {
        setPackage("com.google.android.apps.meetings")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    try {
        context.startActivity(meetIntent)
    } catch (_: Exception) {
        val browserIntent = Intent(Intent.ACTION_VIEW, uri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            context.startActivity(browserIntent)
        } catch (_: Exception) {
            Toast.makeText(context, "No browser or Google Meet app found.", Toast.LENGTH_SHORT).show()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeetingZoneScreen(
    profile: UserProfile?,
    language: AppLanguage,
    meetingViewModel: MeetingZoneViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val meetingsState by meetingViewModel.meetingsState.collectAsStateWithLifecycle()
    val canHost by meetingViewModel.canHostMeetings.collectAsStateWithLifecycle()
    val isFounder by meetingViewModel.isFounder.collectAsStateWithLifecycle()
    val facultyIdentity by meetingViewModel.facultyIdentity.collectAsStateWithLifecycle()
    val statusMessage by meetingViewModel.statusMessage.collectAsStateWithLifecycle()
    val busy by meetingViewModel.busy.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = Upcoming, 1 = Past
    var showCreateDialog by remember { mutableStateOf(false) }
    var editingMeeting by remember { mutableStateOf<MeetingSession?>(null) }
    var deletingMeeting by remember { mutableStateOf<MeetingSession?>(null) }

    LaunchedEffect(statusMessage) {
        val msg = statusMessage
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            meetingViewModel.clearMessage()
        }
    }

    val allMeetings = (meetingsState as? UiState.Success)?.data.orEmpty()
    val nowMs = System.currentTimeMillis()
    val upcomingMeetings = remember(allMeetings, nowMs) {
        allMeetings.filter { isUpcomingMeeting(it, nowMs) }.sortedBy { it.scheduledAtEpochMs }
    }
    val pastMeetings = remember(allMeetings, nowMs) {
        allMeetings.filter { !isUpcomingMeeting(it, nowMs) }.sortedByDescending { it.scheduledAtEpochMs }
    }

    val defaultHostName = remember(facultyIdentity, profile, isFounder) {
        when {
            facultyIdentity.professorName.isNotBlank() -> facultyIdentity.professorName
            !profile?.displayName.isNullOrBlank() -> profile!!.displayName
            isFounder -> "Guru Ji Vision Admin"
            else -> "Faculty Advisor"
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White,
                    actionIconContentColor = Color.White
                ),
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("meeting_zone_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                title = {
                    Column {
                        Text(L10n.meetingZone(language), style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = t(language, "Live Classes & Google Meet Sessions", "লাইভ ক্লাস ও Google Meet সেশন"),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.85f)
                        )
                    }
                },
                actions = {
                    if (canHost) {
                        IconButton(
                            onClick = { showCreateDialog = true },
                            modifier = Modifier.testTag("meeting_create_topbar_button")
                        ) {
                            Icon(Icons.Filled.Add, contentDescription = "Schedule Meeting")
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            if (canHost) {
                FloatingActionButton(
                    onClick = { showCreateDialog = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = Color.White,
                    modifier = Modifier.testTag("meeting_create_fab")
                ) {
                    Icon(Icons.Filled.VideoCall, contentDescription = "Create Meeting")
                }
            }
        }
    ) { innerPadding ->
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            val metrics = rememberResponsiveMetrics(maxWidth)
            val meetingCols = if (maxWidth >= 720.dp) 2 else 1

            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.TopCenter
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .widthIn(max = 960.dp)
                ) {
                    // Role & Host Header Strip
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = metrics.horizontalPadding, vertical = 10.dp),
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                        ),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
                    ) {
                        val headerInfo: @Composable (Modifier) -> Unit = { mod ->
                            Row(
                                modifier = mod,
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.VideoCall,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(28.dp)
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = if (canHost) {
                                            t(language, "Authorized Meeting Host", "অনুমোদিত মিটিং হোস্ট")
                                        } else {
                                            t(language, "Google Meet Classroom", "Google Meet ক্লাসরুম")
                                        },
                                        style = MaterialTheme.typography.titleSmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Text(
                                        text = if (canHost) {
                                            t(
                                                language,
                                                "Create, edit, or delete Google Meet sessions and notify students.",
                                                "Google Meet ক্লাস তৈরি, সম্পাদনা এবং শিক্ষার্থীদের বিজ্ঞপ্তি পাঠান।"
                                            )
                                        } else {
                                            t(
                                                language,
                                                "Join live lectures and doubt-clearing sessions with faculty advisors.",
                                                "অধ্যাপকদের লাইভ ক্লাস ও সেশনে সরাসরি যোগ দিন।"
                                            )
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f)
                                    )
                                }
                            }
                        }
                        if (metrics.isUltraCompact && canHost) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(metrics.cardPadding),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                headerInfo(Modifier.fillMaxWidth())
                                Button(
                                    onClick = { showCreateDialog = true },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .heightIn(min = 48.dp)
                                        .testTag("meeting_schedule_banner_button")
                                ) {
                                    Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text(t(language, "Schedule New Meeting", "নতুন মিটিং তৈরি করুন"))
                                }
                            }
                        } else {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(metrics.cardPadding),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                headerInfo(Modifier.weight(1f))
                                if (canHost) {
                                    Spacer(Modifier.width(8.dp))
                                    Button(
                                        onClick = { showCreateDialog = true },
                                        modifier = Modifier
                                            .heightIn(min = 48.dp)
                                            .testTag("meeting_schedule_banner_button")
                                    ) {
                                        Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text(t(language, "New", "নতুন"))
                                    }
                                }
                            }
                        }
                    }

                    // Upcoming vs Past Tabs
                    TabRow(selectedTabIndex = selectedTab) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = {
                                Text(
                                    "${t(language, "Upcoming", "আসন্ন")} (${upcomingMeetings.size})",
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            },
                            modifier = Modifier.testTag("meeting_tab_upcoming")
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = {
                                Text(
                                    "${t(language, "Past Meetings", "পূর্ববর্তী মিটিং")} (${pastMeetings.size})",
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            },
                            modifier = Modifier.testTag("meeting_tab_past")
                        )
                    }

                    when (val state = meetingsState) {
                        UiState.Loading -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator()
                            }
                        }
                        is UiState.Error -> {
                            Box(modifier = Modifier.padding(16.dp)) {
                                ErrorBannerCard(state.message)
                            }
                        }
                        is UiState.Success -> {
                            val visibleList = if (selectedTab == 0) upcomingMeetings else pastMeetings
                            if (visibleList.isEmpty()) {
                                Box(modifier = Modifier.padding(16.dp)) {
                                    EmptyStateCard(
                                        title = if (selectedTab == 0) {
                                            t(language, "No Upcoming Meetings Scheduled", "কোনো আসন্ন মিটিং নেই")
                                        } else {
                                            t(language, "No Past Meetings Yet", "কোনো পূর্ববর্তী মিটিং নেই")
                                        },
                                        description = if (canHost && selectedTab == 0) {
                                            t(
                                                language,
                                                "Tap '+ New' to publish a Google Meet class and notify Guru Ji Vision students.",
                                                "শিক্ষার্থীদের জন্য নতুন Google Meet সেশন প্রকাশ করতে '+ নতুন' বাটনে ট্যাপ করুন।"
                                            )
                                        } else {
                                            t(
                                                language,
                                                "When professors or Admin schedule a Google Meet session, it will appear here automatically.",
                                                "অধ্যাপক বা অ্যাডমিন নতুন মিটিং শিডিউল করলে এখানে দেখতে পাবেন।"
                                            )
                                        },
                                        icon = Icons.Filled.VideoCall
                                    )
                                }
                            } else {
                                LazyColumn(
                                    modifier = Modifier.fillMaxSize(),
                                    contentPadding = metrics.screenContentPadding,
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    items(
                                        items = visibleList.chunked(meetingCols),
                                        key = { row -> row.joinToString("_") { it.id } }
                                    ) { meetingRow ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                                            verticalAlignment = Alignment.Top
                                        ) {
                                            meetingRow.forEach { meeting ->
                                                val isUpcoming = selectedTab == 0
                                                val canModifyThis = canHost && (isFounder || meeting.hostUid == meetingViewModel.currentUserId)
                                                Box(modifier = Modifier.weight(1f)) {
                                                    MeetingSessionCard(
                                                        meeting = meeting,
                                                        isUpcoming = isUpcoming,
                                                        canModify = canModifyThis,
                                                        language = language,
                                                        onJoin = {
                                                            meetingViewModel.logMeetingJoined(meeting, profile?.role ?: "STUDENT")
                                                            openGoogleMeetLink(context, meeting.meetUrl)
                                                        },
                                                        onEdit = { editingMeeting = meeting },
                                                        onDelete = { deletingMeeting = meeting }
                                                    )
                                                }
                                            }
                                            if (meetingRow.size < meetingCols) {
                                                Spacer(modifier = Modifier.weight(1f))
                                            }
                                        }
                                    }
                                    item { Spacer(Modifier.height(72.dp)) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        MeetingEditorDialog(
            initialMeeting = null,
            defaultHostName = defaultHostName,
            busy = busy,
            language = language,
            onDismiss = { showCreateDialog = false },
            onSave = { title, subject, desc, url, date, time, host, notify ->
                meetingViewModel.createMeeting(
                    title = title,
                    subject = subject,
                    description = desc,
                    meetUrl = url,
                    scheduledDate = date,
                    scheduledTime = time,
                    hostName = host,
                    notifyStudents = notify
                ) {
                    showCreateDialog = false
                }
            }
        )
    }

    editingMeeting?.let { current ->
        MeetingEditorDialog(
            initialMeeting = current,
            defaultHostName = current.hostName.ifBlank { defaultHostName },
            busy = busy,
            language = language,
            onDismiss = { editingMeeting = null },
            onSave = { title, subject, desc, url, date, time, host, notify ->
                meetingViewModel.updateMeeting(
                    meetingId = current.id,
                    title = title,
                    subject = subject,
                    description = desc,
                    meetUrl = url,
                    scheduledDate = date,
                    scheduledTime = time,
                    hostName = host,
                    notifyStudents = notify
                ) {
                    editingMeeting = null
                }
            }
        )
    }

    deletingMeeting?.let { target ->
        AlertDialog(
            onDismissRequest = { deletingMeeting = null },
            title = { Text(t(language, "Delete Meeting?", "মিটিং মুছে ফেলবেন?")) },
            text = {
                Text(
                    t(
                        language,
                        "Are you sure you want to permanently remove \"${target.title}\" from Meeting Zone?",
                        "আপনি কি \"${target.title}\" মিটিংটি স্থায়ীভাবে মুছে ফেলতে চান?"
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        meetingViewModel.deleteMeeting(target.id, target.title)
                        deletingMeeting = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.testTag("confirm_delete_meeting_button")
                ) {
                    Text(t(language, "Delete", "মুছুন"))
                }
            },
            dismissButton = {
                TextButton(onClick = { deletingMeeting = null }) {
                    Text(t(language, "Cancel", "বাতিল"))
                }
            }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MeetingSessionCard(
    meeting: MeetingSession,
    isUpcoming: Boolean,
    canModify: Boolean,
    language: AppLanguage,
    onJoin: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("meeting_card_${meeting.id}"),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(
            width = if (isUpcoming) 1.5.dp else 1.dp,
            color = if (isUpcoming) MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
            else MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                FlowRow(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    StatusPill(
                        label = meeting.subject,
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    StatusPill(
                        label = if (isUpcoming) t(language, "UPCOMING", "আসন্ন") else t(language, "PAST", "সম্পন্ন"),
                        containerColor = if (isUpcoming) Color(0xFFDCFCE7) else MaterialTheme.colorScheme.surfaceVariant,
                        contentColor = if (isUpcoming) Color(0xFF166534) else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (canModify) {
                    Row {
                        IconButton(
                            onClick = onEdit,
                            modifier = Modifier.testTag("edit_meeting_${meeting.id}")
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Edit,
                                contentDescription = "Edit meeting",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                        IconButton(
                            onClick = onDelete,
                            modifier = Modifier.testTag("delete_meeting_${meeting.id}")
                        ) {
                            Icon(
                                imageVector = Icons.Filled.DeleteOutline,
                                contentDescription = "Delete meeting",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }

            Text(
                text = meeting.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            if (meeting.description.isNotBlank()) {
                Text(
                    text = meeting.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.CalendarMonth,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = meeting.scheduledDate,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Filled.Schedule,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = meeting.scheduledTime,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Person,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.secondary
                    )
                    Text(
                        text = "${t(language, "Host", "পরিচালক")}: ${meeting.hostName}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (meeting.notifyStudents && isUpcoming) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.NotificationsActive,
                            contentDescription = null,
                            modifier = Modifier.size(15.dp),
                            tint = Color(0xFFD97706)
                        )
                        Text(
                            text = t(language, "Students notified via announcements", "শিক্ষার্থীদের বিজ্ঞপ্তি পাঠানো হয়েছে"),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFFB45309)
                        )
                    }
                }
            }

            if (isUpcoming) {
                Button(
                    onClick = onJoin,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("join_meeting_${meeting.id}")
                ) {
                    Icon(Icons.Filled.VideoCall, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = t(language, "Join Meeting (Google Meet)", "মিটিংয়ে যোগ দিন (Google Meet)"),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            } else {
                OutlinedButton(
                    onClick = onJoin,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("join_meeting_${meeting.id}")
                ) {
                    Icon(Icons.Filled.VideoCall, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = t(language, "Open Meeting Link", "মিটিং লিংক খুলুন"),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
private fun MeetingEditorDialog(
    initialMeeting: MeetingSession?,
    defaultHostName: String,
    busy: Boolean,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSave: (
        title: String,
        subject: String,
        description: String,
        meetUrl: String,
        date: String,
        time: String,
        hostName: String,
        notifyStudents: Boolean
    ) -> Unit
) {
    val todayDefault = remember { SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH).format(Date()) }
    var title by remember { mutableStateOf(initialMeeting?.title ?: "") }
    var subject by remember { mutableStateOf(initialMeeting?.subject ?: "Agriculture") }
    var description by remember { mutableStateOf(initialMeeting?.description ?: "") }
    var meetUrl by remember { mutableStateOf(initialMeeting?.meetUrl ?: "https://meet.google.com/") }
    var date by remember { mutableStateOf(initialMeeting?.scheduledDate ?: todayDefault) }
    var time by remember { mutableStateOf(initialMeeting?.scheduledTime ?: "04:00 PM") }
    var hostName by remember { mutableStateOf(initialMeeting?.hostName?.ifBlank { defaultHostName } ?: defaultHostName) }
    var notifyStudents by remember { mutableStateOf(initialMeeting?.notifyStudents ?: true) }

    val urlValid = isValidGoogleMeetUrl(meetUrl)
    val canSubmit = !busy &&
        title.trim().length >= 2 &&
        subject.trim().length >= 2 &&
        urlValid &&
        date.trim().length >= 8 &&
        time.trim().length >= 3

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                if (initialMeeting == null) {
                    t(language, "Create Google Meet Session", "নতুন Google Meet সেশন তৈরি করুন")
                } else {
                    t(language, "Edit Meeting Details", "মিটিংয়ের বিবরণ সম্পাদনা করুন")
                }
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Meeting Title *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("meeting_title_input")
                )
                OutlinedTextField(
                    value = subject,
                    onValueChange = { subject = it },
                    label = { Text("Subject (e.g. Agronomy, Botany, Soil Science) *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("meeting_subject_input")
                )
                OutlinedTextField(
                    value = meetUrl,
                    onValueChange = { meetUrl = it },
                    label = { Text("Google Meet Link *") },
                    placeholder = { Text("https://meet.google.com/abc-defg-hij") },
                    isError = meetUrl.isNotBlank() && !urlValid,
                    supportingText = {
                        if (meetUrl.isNotBlank() && !urlValid) {
                            Text("Must start with https://meet.google.com/ followed by the meeting code")
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("meeting_url_input")
                )
                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date (YYYY-MM-DD) *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("meeting_date_input")
                )
                OutlinedTextField(
                    value = time,
                    onValueChange = { time = it },
                    label = { Text("Time (e.g. 04:00 PM) *") },
                    placeholder = { Text("04:00 PM") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("meeting_time_input")
                )
                OutlinedTextField(
                    value = hostName,
                    onValueChange = { hostName = it },
                    label = { Text("Host / Professor Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("meeting_host_input")
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Session Agenda / Description") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth().testTag("meeting_desc_input")
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Notify Students", style = MaterialTheme.typography.labelLarge)
                        Text(
                            "Post an announcement banner to students for this upcoming meeting",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = notifyStudents,
                        onCheckedChange = { notifyStudents = it },
                        modifier = Modifier.testTag("meeting_notify_switch")
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(title, subject, description, meetUrl, date, time, hostName, notifyStudents)
                },
                enabled = canSubmit,
                modifier = Modifier.testTag("meeting_save_button")
            ) {
                Text(if (initialMeeting == null) "Publish Meeting" else "Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
