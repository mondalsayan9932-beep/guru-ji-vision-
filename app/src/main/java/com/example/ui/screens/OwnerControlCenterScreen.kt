package com.example.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudQueue
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.core.ReportTimeframe
import com.example.core.writeCsvReport
import com.example.core.writePdfReport
import com.example.data.model.AppSettings
import com.example.data.model.UiState
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.PrivacyGuardBadge
import com.example.ui.components.StatusPill
import com.example.viewmodel.OwnerControlViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private data class OwnerSectionDef(
    val index: Int,
    val label: String,
    val shortLabel: String,
    val icon: ImageVector,
    val tag: String
)

private val ownerSections = listOf(
    OwnerSectionDef(0, "Overview & Reports", "Overview", Icons.Filled.Dashboard, "owner_sec_overview"),
    OwnerSectionDef(1, "Activity & Exams", "Activity", Icons.Filled.School, "owner_sec_activity"),
    OwnerSectionDef(2, "AI, Cloud & Health", "AI & Cloud", Icons.Filled.CloudQueue, "owner_sec_ai_cloud"),
    OwnerSectionDef(3, "Farmer Desk & Reports", "Moderation", Icons.Filled.Flag, "owner_sec_moderation"),
    OwnerSectionDef(4, "Controls & Staff", "Controls", Icons.Filled.Tune, "owner_sec_controls")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerControlCenterScreen(
    isFounder: Boolean,
    appSettings: AppSettings,
    ownerViewModel: OwnerControlViewModel?,
    onBack: () -> Unit,
    onOpenAdminContentConsole: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    if (!isFounder || ownerViewModel == null) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Owner Control Center") },
                    navigationIcon = {
                        IconButton(onClick = onBack, modifier = Modifier.testTag("owner_back_button")) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                )
            }
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                EmptyStateCard(
                    title = "Founder / Owner Access Restricted",
                    description = "Only the verified Guru Ji Vision Founder / Owner account can access the Owner Monitoring & Control Center.",
                    icon = Icons.Filled.Lock
                )
            }
        }
        return
    }

    val snapshot by ownerViewModel.reportSnapshot.collectAsStateWithLifecycle()
    val selectedTimeframe by ownerViewModel.selectedTimeframe.collectAsStateWithLifecycle()
    val usersState by ownerViewModel.allUsers.collectAsStateWithLifecycle()
    val queriesState by ownerViewModel.allFarmerQueries.collectAsStateWithLifecycle()
    val materialsState by ownerViewModel.allStudyMaterials.collectAsStateWithLifecycle()
    val activitiesState by ownerViewModel.activityEvents.collectAsStateWithLifecycle()
    val examsState by ownerViewModel.examStats.collectAsStateWithLifecycle()
    val aiLogsState by ownerViewModel.aiUsageLogs.collectAsStateWithLifecycle()
    val errorLogsState by ownerViewModel.errorLogs.collectAsStateWithLifecycle()
    val reportsState by ownerViewModel.contentReports.collectAsStateWithLifecycle()
    val adminsState by ownerViewModel.adminRecords.collectAsStateWithLifecycle()
    val announcementsState by ownerViewModel.allAnnouncements.collectAsStateWithLifecycle()
    val auditLogsState by ownerViewModel.auditLogs.collectAsStateWithLifecycle()
    val statusBanner by ownerViewModel.statusBanner.collectAsStateWithLifecycle()
    val busy by ownerViewModel.busy.collectAsStateWithLifecycle()

    var activeSection by remember { mutableIntStateOf(0) }

    LaunchedEffect(statusBanner) {
        val msg = statusBanner
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            ownerViewModel.clearBanner()
        }
    }

    // Zero-permission Android Storage Access Framework launchers for CSV & PDF report export
    val csvExportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("text/csv")
    ) { uri ->
        if (uri != null) {
            scope.launch {
                val res = withContext(Dispatchers.IO) { writeCsvReport(context, uri, snapshot) }
                ownerViewModel.showBanner(
                    res.fold(
                        onSuccess = { "CSV report exported successfully." },
                        onFailure = { "CSV export failed: ${it.localizedMessage ?: "I/O error"}" }
                    )
                )
            }
        }
    }

    val pdfExportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/pdf")
    ) { uri ->
        if (uri != null) {
            scope.launch {
                val res = withContext(Dispatchers.IO) { writePdfReport(context, uri, snapshot) }
                ownerViewModel.showBanner(
                    res.fold(
                        onSuccess = { "Executive PDF report exported successfully." },
                        onFailure = { "PDF export failed: ${it.localizedMessage ?: "I/O error"}" }
                    )
                )
            }
        }
    }

    val fileStamp = remember { SimpleDateFormat("yyyyMMdd_HHmm", Locale.ENGLISH).format(Date()) }

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
                title = {
                    Column {
                        Text("Owner Monitoring & Control", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Guru Ji Vision • Super Admin Live Telemetry",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.85f)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("owner_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to Home")
                    }
                },
                actions = {
                    IconButton(
                        onClick = { csvExportLauncher.launch("GuruJiVision_Report_${selectedTimeframe.name}_$fileStamp.csv") },
                        modifier = Modifier.testTag("owner_export_csv_topbar")
                    ) {
                        Icon(Icons.Filled.Download, contentDescription = "Export CSV Report")
                    }
                    IconButton(
                        onClick = { pdfExportLauncher.launch("GuruJiVision_Report_${selectedTimeframe.name}_$fileStamp.pdf") },
                        modifier = Modifier.testTag("owner_export_pdf_topbar")
                    ) {
                        Icon(Icons.Filled.PictureAsPdf, contentDescription = "Export PDF Report")
                    }
                }
            )
        }
    ) { padding ->
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            val isDesktopOrTablet = maxWidth >= 840.dp
            val isWide = maxWidth >= 600.dp

            Row(modifier = Modifier.fillMaxSize()) {
                if (isDesktopOrTablet) {
                    NavigationRail(
                        containerColor = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxHeight()
                    ) {
                        Spacer(Modifier.height(12.dp))
                        ownerSections.forEach { sec ->
                            NavigationRailItem(
                                selected = activeSection == sec.index,
                                onClick = { activeSection = sec.index },
                                icon = { Icon(sec.icon, contentDescription = sec.label) },
                                label = { Text(sec.shortLabel) },
                                modifier = Modifier.testTag(sec.tag)
                            )
                        }
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                    contentAlignment = Alignment.TopCenter
                ) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .widthIn(max = 1120.dp),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // Compact / Phone Section Navigation Chips
                        if (!isDesktopOrTablet) {
                            item {
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    items(ownerSections, key = { it.index }) { sec ->
                                        FilterChip(
                                            selected = activeSection == sec.index,
                                            onClick = { activeSection = sec.index },
                                            leadingIcon = {
                                                Icon(sec.icon, contentDescription = null, modifier = Modifier.size(16.dp))
                                            },
                                            label = { Text(sec.shortLabel) },
                                            modifier = Modifier.testTag(sec.tag)
                                        )
                                    }
                                }
                            }
                        }

                        // Owner Header Bar: Timeframe Filter + CSV/PDF Export + Content CMS shortcut
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.medium,
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(14.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Icon(Icons.Filled.Security, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                            Text("Report Window & Exports", style = MaterialTheme.typography.titleSmall)
                                        }
                                        StatusPill(
                                            label = "LIVE CLOUD DATA",
                                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }

                                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        items(ReportTimeframe.entries) { tf ->
                                            FilterChip(
                                                selected = selectedTimeframe == tf,
                                                onClick = { ownerViewModel.setTimeframe(tf) },
                                                label = { Text(tf.label) },
                                                modifier = Modifier.testTag("owner_tf_${tf.name.lowercase()}")
                                            )
                                        }
                                    }

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        OutlinedButton(
                                            onClick = {
                                                csvExportLauncher.launch("GuruJiVision_Report_${selectedTimeframe.name}_$fileStamp.csv")
                                            },
                                            modifier = Modifier.weight(1f).testTag("owner_export_csv_button")
                                        ) {
                                            Icon(Icons.Filled.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(Modifier.width(4.dp))
                                            Text("Export CSV", maxLines = 1)
                                        }
                                        Button(
                                            onClick = {
                                                pdfExportLauncher.launch("GuruJiVision_Report_${selectedTimeframe.name}_$fileStamp.pdf")
                                            },
                                            modifier = Modifier.weight(1f).testTag("owner_export_pdf_button")
                                        ) {
                                            Icon(Icons.Filled.PictureAsPdf, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(Modifier.width(4.dp))
                                            Text("Export PDF", maxLines = 1)
                                        }
                                        OutlinedButton(
                                            onClick = onOpenAdminContentConsole,
                                            modifier = Modifier.testTag("owner_open_cms_button")
                                        ) {
                                            Text("CMS", maxLines = 1)
                                        }
                                    }
                                }
                            }
                        }

                        // Privacy Guard Banner (Always visible)
                        item { PrivacyGuardBadge() }

                        // Active Panel Body
                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                when (activeSection) {
                                    0 -> OwnerOverviewPanel(
                                        snapshot = snapshot,
                                        users = (usersState as? UiState.Success)?.data.orEmpty(),
                                        isWide = isWide,
                                        onJumpToAlerts = { activeSection = 2 },
                                        onJumpToReports = { activeSection = 3 },
                                        onJumpToFarmerDesk = { activeSection = 3 }
                                    )
                                    1 -> OwnerActivityAcademicsPanel(
                                        snapshot = snapshot,
                                        activities = (activitiesState as? UiState.Success)?.data.orEmpty(),
                                        materials = (materialsState as? UiState.Success)?.data.orEmpty(),
                                        examStats = (examsState as? UiState.Success)?.data.orEmpty(),
                                        isWide = isWide
                                    )
                                    2 -> OwnerAiCloudHealthPanel(
                                        snapshot = snapshot,
                                        aiLogs = (aiLogsState as? UiState.Success)?.data.orEmpty(),
                                        errorLogs = (errorLogsState as? UiState.Success)?.data.orEmpty(),
                                        isWide = isWide,
                                        onResolveError = { id, res -> ownerViewModel.resolveErrorLog(id, res) },
                                        onDeleteError = { id -> ownerViewModel.deleteErrorLog(id) },
                                        onRunDiagnosticPing = { ownerViewModel.logDiagnosticTestAlert() }
                                    )
                                    3 -> OwnerDeskModerationPanel(
                                        snapshot = snapshot,
                                        queries = (queriesState as? UiState.Success)?.data.orEmpty(),
                                        reports = (reportsState as? UiState.Success)?.data.orEmpty(),
                                        busy = busy,
                                        onReplyFarmerQuery = { id, status, reply ->
                                            ownerViewModel.replyToFarmerQuery(id, status, reply)
                                        },
                                        onDismissReport = { id -> ownerViewModel.dismissContentReport(id) },
                                        onHidePostAndResolve = { rep -> ownerViewModel.hidePostAndResolveReport(rep) }
                                    )
                                    4 -> OwnerControlsGovernancePanel(
                                        appSettings = appSettings,
                                        admins = (adminsState as? UiState.Success)?.data.orEmpty(),
                                        announcements = (announcementsState as? UiState.Success)?.data.orEmpty(),
                                        auditLogs = (auditLogsState as? UiState.Success)?.data.orEmpty(),
                                        busy = busy,
                                        onSaveSettings = { updated, msg -> ownerViewModel.updateAppSettings(updated, msg) },
                                        onGrantStaff = { uid, email, role, done ->
                                            ownerViewModel.grantStaffRole(uid, email, role, done)
                                        },
                                        onRevokeStaff = { uid -> ownerViewModel.revokeStaffRole(uid) },
                                        onBroadcastAnnouncement = { title, message, aud, done ->
                                            ownerViewModel.broadcastAnnouncement(title, message, aud, done)
                                        },
                                        onDeleteAnnouncement = { id -> ownerViewModel.deleteAnnouncement(id) }
                                    )
                                }
                            }
                        }

                        item { Spacer(Modifier.height(16.dp)) }
                    }
                }
            }
        }
    }
}
