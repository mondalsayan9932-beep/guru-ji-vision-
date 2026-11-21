package com.example.ui.screens

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.VerticalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.data.model.DoubtChatThread
import com.example.data.model.DoubtMessage
import com.example.data.model.ProfessorProfile
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.StatusPill
import com.example.ui.components.decodeScaledBitmap
import com.example.viewmodel.ActiveChatSession
import com.example.viewmodel.DoubtZoneViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private fun formatChatTime(seconds: Long?): String {
    if (seconds == null || seconds <= 0L) return "Just now"
    return SimpleDateFormat("dd MMM, hh:mm a", Locale.ENGLISH).format(Date(seconds * 1000L))
}

private fun decodeBase64Bitmap(base64: String?): Bitmap? {
    if (base64.isNullOrBlank()) return null
    return try {
        val bytes = Base64.decode(base64, Base64.DEFAULT)
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    } catch (_: Exception) {
        null
    }
}

private fun facultyInitials(name: String): String {
    val cleaned = name
        .replace(Regex("^(Dr\\.|Prof\\.|Mr\\.|Ms\\.|Mrs\\.)\\s*", RegexOption.IGNORE_CASE), "")
        .trim()
    val parts = cleaned.split(Regex("\\s+")).filter { it.isNotBlank() }
    return when {
        parts.size >= 2 -> "${parts.first().first().uppercaseChar()}${parts.last().first().uppercaseChar()}"
        parts.size == 1 -> parts.first().take(2).uppercase()
        else -> "GV"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoubtZoneScreen(
    profile: UserProfile?,
    language: AppLanguage,
    doubtViewModel: DoubtZoneViewModel,
    onBack: () -> Unit
) {
    val professorsState by doubtViewModel.professorsState.collectAsStateWithLifecycle()
    val facultyIdentity by doubtViewModel.facultyIdentity.collectAsStateWithLifecycle()
    val studentThreadsState by doubtViewModel.studentThreadsState.collectAsStateWithLifecycle()
    val professorThreadsState by doubtViewModel.professorThreadsState.collectAsStateWithLifecycle()
    val activeSession by doubtViewModel.activeSession.collectAsStateWithLifecycle()
    val activeMessagesState by doubtViewModel.activeMessagesState.collectAsStateWithLifecycle()
    val statusMessage by doubtViewModel.statusMessage.collectAsStateWithLifecycle()
    val sending by doubtViewModel.sending.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }
    var selectedTab by remember(facultyIdentity.isAuthorizedProfessor) {
        mutableIntStateOf(if (facultyIdentity.isAuthorizedProfessor) 2 else 0)
    }
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(statusMessage) {
        val msg = statusMessage
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            doubtViewModel.clearMessage()
        }
    }

    val professors = (professorsState as? UiState.Success)?.data.orEmpty()
    val studentThreads = (studentThreadsState as? UiState.Success)?.data.orEmpty()
    val professorThreads = (professorThreadsState as? UiState.Success)?.data.orEmpty()
    val studentUnreadTotal = studentThreads.sumOf { it.unreadForStudent }.toInt()
    val profUnreadTotal = professorThreads.sumOf { it.unreadForProfessor }.toInt()

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        val isTwoPane = maxWidth >= 840.dp

        // On compact phones, pressing system back closes the active chat back to the directory/inbox
        if (!isTwoPane && activeSession != null) {
            BackHandler { doubtViewModel.closeActiveChat() }
        }

        if (!isTwoPane && activeSession != null) {
            PrivateChatRoomPane(
                session = activeSession!!,
                currentUserId = doubtViewModel.currentUserId,
                senderDisplayName = profile?.displayName.orEmpty().ifBlank { "Student" },
                messagesState = activeMessagesState,
                sending = sending,
                language = language,
                showBackButton = true,
                onBack = { doubtViewModel.closeActiveChat() },
                onSend = { text, bmp, done ->
                    doubtViewModel.sendDoubtMessage(
                        text = text,
                        imageBitmap = bmp,
                        senderDisplayName = profile?.displayName.orEmpty().ifBlank { "Student" },
                        onSuccess = done
                    )
                },
                onMarkRead = { msgs -> doubtViewModel.markActiveConversationRead(msgs) },
                onDeleteOwnMessage = { id -> doubtViewModel.deleteOwnMessage(id) }
            )
            return@BoxWithConstraints
        }

        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White
                    ),
                    navigationIcon = {
                        IconButton(onClick = onBack, modifier = Modifier.testTag("doubt_zone_back_button")) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    title = {
                        Column {
                            Text(
                                text = L10n.doubtZoneFull(language),
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = if (facultyIdentity.isAuthorizedProfessor) {
                                    "Faculty Mode • ${facultyIdentity.professorName}"
                                } else {
                                    t(language, "Private 1-on-1 Faculty Academic Support", "অধ্যাপকের সাথে ব্যক্তিগত ১-অন-১ একাডেমিক চ্যাট")
                                },
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.85f)
                            )
                        }
                    }
                )
            }
        ) { innerPadding ->
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                // Left Pane (or Full Width on Phones): Professor Directory & Conversations
                Column(
                    modifier = if (isTwoPane) {
                        Modifier.weight(0.46f).fillMaxHeight()
                    } else {
                        Modifier.fillMaxSize()
                    }
                ) {
                    // Privacy Guarantee Strip
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = "Private chat guarantee",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = t(
                                    language,
                                    "Private rooms: Only you and your chosen professor can view your doubts.",
                                    "গোপনীয়তা সুরক্ষিত: শুধুমাত্র আপনি ও আপনার নির্বাচিত অধ্যাপক এই চ্যাট দেখতে পারবেন।"
                                ),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }

                    // Tabs: Faculty Directory | My Chats | (Professor Inbox if authorized faculty)
                    val safeTab = if (!facultyIdentity.isAuthorizedProfessor && selectedTab == 2) 0 else selectedTab
                    TabRow(selectedTabIndex = safeTab) {
                        Tab(
                            selected = safeTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("${t(language, "Professors", "অধ্যাপক")} (${professors.size})", maxLines = 1) },
                            modifier = Modifier.testTag("doubt_tab_professors")
                        )
                        Tab(
                            selected = safeTab == 1,
                            onClick = { selectedTab = 1 },
                            text = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(t(language, "My Chats", "আমার চ্যাট"), maxLines = 1)
                                    if (studentUnreadTotal > 0) {
                                        Badge(containerColor = MaterialTheme.colorScheme.error) {
                                            Text("$studentUnreadTotal", color = Color.White)
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.testTag("doubt_tab_my_chats")
                        )
                        if (facultyIdentity.isAuthorizedProfessor) {
                            Tab(
                                selected = safeTab == 2,
                                onClick = { selectedTab = 2 },
                                text = {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(t(language, "Inbox", "শিক্ষার্থী প্রশ্ন"), maxLines = 1)
                                        if (profUnreadTotal > 0) {
                                            Badge(containerColor = MaterialTheme.colorScheme.error) {
                                                Text("$profUnreadTotal", color = Color.White)
                                            }
                                        }
                                    }
                                },
                                modifier = Modifier.testTag("doubt_tab_prof_inbox")
                            )
                        }
                    }

                    when (safeTab) {
                        // TAB 0: 9-FACULTY PROFESSOR DIRECTORY
                        0 -> {
                            val filtered = remember(professors, searchQuery) {
                                val q = searchQuery.trim().lowercase(Locale.ROOT)
                                if (q.isBlank()) professors
                                else professors.filter { p ->
                                    p.name.lowercase(Locale.ROOT).contains(q) ||
                                        p.subject.lowercase(Locale.ROOT).contains(q) ||
                                        p.specialization.lowercase(Locale.ROOT).contains(q) ||
                                        p.department.lowercase(Locale.ROOT).contains(q)
                                }
                            }
                            val unreadByProfId = remember(studentThreads) {
                                studentThreads.associate { it.professorId to it.unreadForStudent.toInt() }
                            }

                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                item {
                                    OutlinedTextField(
                                        value = searchQuery,
                                        onValueChange = { searchQuery = it },
                                        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = "Search faculty") },
                                        placeholder = {
                                            Text(t(language, "Search by name, subject or specialization...", "নাম, বিষয় বা বিশেষজ্ঞতা খুঁজুন..."))
                                        },
                                        singleLine = true,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .testTag("doubt_faculty_search_input")
                                    )
                                }

                                items(filtered, key = { it.id }) { prof ->
                                    ProfessorProfileCard(
                                        professor = prof,
                                        unreadCount = unreadByProfId[prof.id] ?: 0,
                                        isSelected = activeSession?.professor?.id == prof.id && activeSession?.viewingAsProfessor == false,
                                        language = language,
                                        onAskDoubt = {
                                            doubtViewModel.openChatWithProfessor(
                                                professor = prof,
                                                studentName = profile?.displayName.orEmpty().ifBlank { "Student" },
                                                studentSemester = profile?.semester ?: 1L
                                            )
                                        }
                                    )
                                }
                                item { Spacer(Modifier.height(16.dp)) }
                            }
                        }

                        // TAB 1: STUDENT'S OWN CONVERSATIONS
                        1 -> {
                            when (val state = studentThreadsState) {
                                UiState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator()
                                }
                                is UiState.Error -> Box(Modifier.padding(16.dp)) { ErrorBannerCard(state.message) }
                                is UiState.Success -> {
                                    if (state.data.isEmpty()) {
                                        Box(Modifier.padding(16.dp)) {
                                            EmptyStateCard(
                                                title = t(language, "No Conversations Yet", "এখনো কোনো কথোপকথন নেই"),
                                                description = t(
                                                    language,
                                                    "Select any professor from the Professors tab and tap 'Ask Doubt' to start a private academic conversation.",
                                                    "অধ্যাপক তালিকা থেকে যেকোনো অধ্যাপক নির্বাচন করে 'প্রশ্ন করুন' বাটনে ট্যাপ করুন।"
                                                ),
                                                icon = Icons.Filled.Forum
                                            )
                                        }
                                    } else {
                                        LazyColumn(
                                            modifier = Modifier.fillMaxSize(),
                                            contentPadding = PaddingValues(16.dp),
                                            verticalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            items(state.data, key = { it.id }) { thread ->
                                                ConversationThreadRow(
                                                    title = thread.professorName,
                                                    subtitle = thread.lastMessagePreview.ifBlank { "Tap to continue chat" },
                                                    timestamp = formatChatTime(thread.updatedAt?.seconds),
                                                    unreadCount = thread.unreadForStudent.toInt(),
                                                    isSelected = activeSession?.chatId == thread.id,
                                                    tag = "student_thread_${thread.id}",
                                                    onClick = {
                                                        doubtViewModel.openExistingThread(thread, asProfessor = false)
                                                    }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // TAB 2: AUTHORIZED PROFESSOR'S ASSIGNED STUDENT DOUBTS INBOX
                        2 -> {
                            when (val state = professorThreadsState) {
                                UiState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator()
                                }
                                is UiState.Error -> Box(Modifier.padding(16.dp)) { ErrorBannerCard(state.message) }
                                is UiState.Success -> {
                                    if (state.data.isEmpty()) {
                                        Box(Modifier.padding(16.dp)) {
                                            EmptyStateCard(
                                                title = t(language, "No Student Doubts Assigned Yet", "এখনো কোনো শিক্ষার্থীর প্রশ্ন আসেনি"),
                                                description = t(
                                                    language,
                                                    "When students ask you a doubt, their private conversation threads will appear here for you to reply.",
                                                    "শিক্ষার্থীরা আপনাকে প্রশ্ন পাঠালে তাদের ব্যক্তিগত চ্যাট এখানে দেখা যাবে।"
                                                ),
                                                icon = Icons.Filled.School
                                            )
                                        }
                                    } else {
                                        LazyColumn(
                                            modifier = Modifier.fillMaxSize(),
                                            contentPadding = PaddingValues(16.dp),
                                            verticalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            items(state.data, key = { it.id }) { thread ->
                                                val semLabel = if (thread.studentSemester > 0) " • Sem ${thread.studentSemester}" else ""
                                                ConversationThreadRow(
                                                    title = "${thread.studentName}$semLabel",
                                                    subtitle = thread.lastMessagePreview.ifBlank { "New student doubt" },
                                                    timestamp = formatChatTime(thread.updatedAt?.seconds),
                                                    unreadCount = thread.unreadForProfessor.toInt(),
                                                    isSelected = activeSession?.chatId == thread.id,
                                                    tag = "prof_thread_${thread.id}",
                                                    onClick = {
                                                        doubtViewModel.openExistingThread(thread, asProfessor = true)
                                                    }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Right Pane on Tablets & Desktops: Live Private Chat Room
                if (isTwoPane) {
                    VerticalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Box(modifier = Modifier.weight(0.54f).fillMaxHeight()) {
                        val current = activeSession
                        if (current == null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                EmptyStateCard(
                                    title = t(language, "Select a Professor or Conversation", "একজন অধ্যাপক বা চ্যাট নির্বাচন করুন"),
                                    description = t(
                                        language,
                                        "Tap 'Ask Doubt' on any faculty profile to open a private 1-on-1 chat room with text and photo attachment support.",
                                        "যেকোনো অধ্যাপকের কার্ডে 'প্রশ্ন করুন' ট্যাপ করে ব্যক্তিগত চ্যাট শুরু করুন।"
                                    ),
                                    icon = Icons.Filled.Forum
                                )
                            }
                        } else {
                            PrivateChatRoomPane(
                                session = current,
                                currentUserId = doubtViewModel.currentUserId,
                                senderDisplayName = profile?.displayName.orEmpty().ifBlank { "Student" },
                                messagesState = activeMessagesState,
                                sending = sending,
                                language = language,
                                showBackButton = false,
                                onBack = { doubtViewModel.closeActiveChat() },
                                onSend = { text, bmp, done ->
                                    doubtViewModel.sendDoubtMessage(
                                        text = text,
                                        imageBitmap = bmp,
                                        senderDisplayName = profile?.displayName.orEmpty().ifBlank { "Student" },
                                        onSuccess = done
                                    )
                                },
                                onMarkRead = { msgs -> doubtViewModel.markActiveConversationRead(msgs) },
                                onDeleteOwnMessage = { id -> doubtViewModel.deleteOwnMessage(id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfessorProfileCard(
    professor: ProfessorProfile,
    unreadCount: Int,
    isSelected: Boolean,
    language: AppLanguage,
    onAskDoubt: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("professor_card_${professor.id}"),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
            else MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(
            width = if (isSelected) 1.8.dp else 1.dp,
            color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.45f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar or Academic Monogram
                if (professor.avatarUrl.isNotBlank()) {
                    AsyncImage(
                        model = professor.avatarUrl,
                        contentDescription = professor.name,
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = facultyInitials(professor.name),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }

                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = professor.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.weight(1f)
                        )
                        if (unreadCount > 0) {
                            Badge(containerColor = MaterialTheme.colorScheme.error) {
                                Text("$unreadCount new", color = Color.White)
                            }
                        }
                    }
                    Text(
                        text = professor.designation,
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (professor.qualification.isNotBlank()) {
                        Text(
                            text = professor.qualification,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Metadata Chips — strictly showing only provided fields (never inventing missing ones)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatusPill(
                    label = "Dept: ${professor.department}",
                    containerColor = MaterialTheme.colorScheme.secondaryContainer,
                    contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                )
                if (professor.subject.isNotBlank()) {
                    StatusPill(
                        label = professor.subject,
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            // Specialization Box
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = t(language, "Specialization", "বিশেষজ্ঞতা"),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = professor.specialization,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // Email row ONLY where officially provided
            if (professor.email.isNotBlank()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Email,
                        contentDescription = "Faculty Email",
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = professor.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Button(
                onClick = onAskDoubt,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("ask_doubt_${professor.id}")
            ) {
                Icon(Icons.Filled.Forum, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(t(language, "Ask Doubt / Start Chat", "প্রশ্ন করুন / চ্যাট শুরু করুন"))
            }
        }
    }
}

@Composable
private fun ConversationThreadRow(
    title: String,
    subtitle: String,
    timestamp: String,
    unreadCount: Int,
    isSelected: Boolean,
    tag: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag(tag),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
            else MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(
            width = if (unreadCount > 0 || isSelected) 1.5.dp else 1.dp,
            color = if (unreadCount > 0 || isSelected) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = facultyInitials(title),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = if (unreadCount > 0) FontWeight.Bold else FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = timestamp,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    if (unreadCount > 0) {
                        Spacer(Modifier.width(8.dp))
                        Badge(containerColor = MaterialTheme.colorScheme.error) {
                            Text("$unreadCount", color = Color.White)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PrivateChatRoomPane(
    session: ActiveChatSession,
    currentUserId: String,
    senderDisplayName: String,
    messagesState: UiState<List<DoubtMessage>>,
    sending: Boolean,
    language: AppLanguage,
    showBackButton: Boolean,
    onBack: () -> Unit,
    onSend: (text: String, bitmap: Bitmap?, onDone: () -> Unit) -> Unit,
    onMarkRead: (List<DoubtMessage>) -> Unit,
    onDeleteOwnMessage: (String) -> Unit
) {
    val context = LocalContext.current
    var draftText by remember(session.chatId) { mutableStateOf("") }
    var attachedBitmap by remember(session.chatId) { mutableStateOf<Bitmap?>(null) }
    var previewBitmap by remember { mutableStateOf<Bitmap?>(null) }

    // Zero-permission Android Photo Picker (Google Play Policy compliant)
    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            attachedBitmap = decodeScaledBitmap(context, uri, maxDimPx = 900)
        }
    }

    val messages = (messagesState as? UiState.Success)?.data.orEmpty()
    val listState = rememberLazyListState()

    LaunchedEffect(session.chatId, messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
            onMarkRead(messages)
        }
    }

    val headerTitle = if (session.viewingAsProfessor) {
        val sem = if (session.studentSemester > 0) " (Sem ${session.studentSemester})" else ""
        "${session.studentName}$sem"
    } else {
        session.professor.name
    }
    val headerSub = if (session.viewingAsProfessor) {
        t(language, "Private Student Doubt Thread", "শিক্ষার্থীর ব্যক্তিগত প্রশ্ন চ্যাট")
    } else {
        session.professor.specialization.ifBlank { session.professor.designation }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                ),
                navigationIcon = {
                    if (showBackButton) {
                        IconButton(onClick = onBack, modifier = Modifier.testTag("chat_back_button")) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to Doubt Zone")
                        }
                    }
                },
                title = {
                    Column {
                        Text(headerTitle, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(
                            text = headerSub,
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.85f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Private encryption/isolation reminder banner
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Filled.Lock, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                    Text(
                        text = t(
                            language,
                            "Private conversation — visible strictly to student & assigned professor only.",
                            "ব্যক্তিগত চ্যাট — শুধুমাত্র শিক্ষার্থী ও নির্ধারিত অধ্যাপকের জন্য দৃশ্যমান।"
                        ),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            // Messages Stream
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                when (messagesState) {
                    UiState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                    is UiState.Error -> Box(Modifier.padding(16.dp)) { ErrorBannerCard(messagesState.message) }
                    is UiState.Success -> {
                        if (messages.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxSize().padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                EmptyStateCard(
                                    title = t(language, "Start Your Academic Conversation", "আপনার একাডেমিক প্রশ্ন লিখুন"),
                                    description = t(
                                        language,
                                        "Send your question or attach a photo of notes, crop specimens, or lab work. Only you and $headerTitle can read this chat.",
                                        "আপনার প্রশ্ন লিখুন অথবা নোটস/ফসলের ছবি সংযুক্ত করে পাঠান।"
                                    ),
                                    icon = Icons.Filled.Forum
                                )
                            }
                        } else {
                            LazyColumn(
                                state = listState,
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(14.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(messages, key = { it.id }) { msg ->
                                    val isMine = msg.senderId == currentUserId
                                    ChatMessageBubble(
                                        message = msg,
                                        isMine = isMine,
                                        onImageClick = { bmp -> previewBitmap = bmp },
                                        onDeleteOwn = { onDeleteOwnMessage(msg.id) }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Attached Image Preview Bar
            attachedBitmap?.let { bmp ->
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Image(
                            bitmap = bmp.asImageBitmap(),
                            contentDescription = "Attached doubt photo",
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Text(
                            text = t(language, "Photo ready to send", "ছবি পাঠানোর জন্য প্রস্তুত"),
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { attachedBitmap = null }) {
                            Icon(Icons.Filled.Close, contentDescription = "Remove photo")
                        }
                    }
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            // Message Composer Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                IconButton(
                    onClick = {
                        imagePicker.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    enabled = !sending,
                    modifier = Modifier.testTag("chat_attach_photo_button")
                ) {
                    Icon(
                        imageVector = Icons.Filled.AddPhotoAlternate,
                        contentDescription = "Attach image",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }

                OutlinedTextField(
                    value = draftText,
                    onValueChange = { draftText = it },
                    placeholder = {
                        Text(
                            if (session.viewingAsProfessor) {
                                t(language, "Write your reply...", "উত্তর লিখুন...")
                            } else {
                                t(language, "Ask your academic doubt...", "আপনার প্রশ্ন লিখুন...")
                            }
                        )
                    },
                    maxLines = 4,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("chat_message_input")
                )

                IconButton(
                    onClick = {
                        val txt = draftText
                        val img = attachedBitmap
                        onSend(txt, img) {
                            draftText = ""
                            attachedBitmap = null
                        }
                    },
                    enabled = !sending && (draftText.isNotBlank() || attachedBitmap != null),
                    modifier = Modifier.testTag("chat_send_button")
                ) {
                    if (sending) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send message",
                            tint = if (draftText.isNotBlank() || attachedBitmap != null) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                            }
                        )
                    }
                }
            }
        }
    }

    // Full-screen photo preview dialog
    previewBitmap?.let { bmp ->
        Dialog(onDismissRequest = { previewBitmap = null }) {
            Card(shape = MaterialTheme.shapes.large) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Image(
                        bitmap = bmp.asImageBitmap(),
                        contentDescription = "Full size doubt attachment",
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 460.dp)
                            .clip(RoundedCornerShape(10.dp)),
                        contentScale = ContentScale.Fit
                    )
                    Button(
                        onClick = { previewBitmap = null },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Close")
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatMessageBubble(
    message: DoubtMessage,
    isMine: Boolean,
    onImageClick: (Bitmap) -> Unit,
    onDeleteOwn: () -> Unit
) {
    val decodedBitmap = remember(message.imageBase64) { decodeBase64Bitmap(message.imageBase64) }
    val bubbleColor = if (isMine) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
    val textColor = if (isMine) Color.White else MaterialTheme.colorScheme.onSurface
    val metaColor = if (isMine) Color.White.copy(alpha = 0.8f) else MaterialTheme.colorScheme.onSurfaceVariant

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
    ) {
        Card(
            modifier = Modifier.widthIn(max = 310.dp),
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isMine) 16.dp else 4.dp,
                bottomEnd = if (isMine) 4.dp else 16.dp
            ),
            colors = CardDefaults.cardColors(containerColor = bubbleColor),
            border = if (isMine) null else BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isMine) "You" else message.senderName,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = metaColor
                    )
                    if (isMine && message.id.isNotBlank()) {
                        IconButton(
                            onClick = onDeleteOwn,
                            modifier = Modifier.size(22.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.DeleteOutline,
                                contentDescription = "Delete own message",
                                tint = metaColor,
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }

                if (decodedBitmap != null) {
                    Image(
                        bitmap = decodedBitmap.asImageBitmap(),
                        contentDescription = "Shared doubt image",
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 200.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { onImageClick(decodedBitmap) },
                        contentScale = ContentScale.Crop
                    )
                }

                if (message.text.isNotBlank()) {
                    Text(
                        text = message.text,
                        style = MaterialTheme.typography.bodyMedium,
                        color = textColor
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = formatChatTime(message.createdAt?.seconds),
                        style = MaterialTheme.typography.labelSmall,
                        color = metaColor
                    )
                    if (isMine) {
                        Spacer(Modifier.width(4.dp))
                        Icon(
                            imageVector = if (message.readByRecipient) Icons.Filled.DoneAll else Icons.Filled.Done,
                            contentDescription = if (message.readByRecipient) "Read" else "Sent",
                            tint = if (message.readByRecipient) Color(0xFF86EFAC) else metaColor,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(Modifier.width(2.dp))
                        Text(
                            text = if (message.readByRecipient) "Read" else "Sent",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (message.readByRecipient) Color(0xFF86EFAC) else metaColor
                        )
                    }
                }
            }
        }
    }
}
