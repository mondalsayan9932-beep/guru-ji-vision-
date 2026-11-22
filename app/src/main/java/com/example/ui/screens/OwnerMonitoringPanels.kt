package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudQueue
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.core.OwnerReportSnapshot
import com.example.core.formatByteSize
import com.example.data.model.ActivityEvent
import com.example.data.model.AdminAuditLog
import com.example.data.model.AdminRecord
import com.example.data.model.AiUsageLog
import com.example.data.model.Announcement
import com.example.data.model.AppSettings
import com.example.data.model.ContentReport
import com.example.data.model.ErrorLog
import com.example.data.model.ExamStat
import com.example.data.model.FarmerQuery
import com.example.data.model.StudyMaterial
import com.example.data.model.UserProfile
import com.example.ui.components.DonutSegment
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.HorizontalRatioBar
import com.example.ui.components.OwnerKpiCard
import com.example.ui.components.SegmentedDonutChart
import com.example.ui.components.StatusPill
import com.example.ui.components.TimeSeriesBarChart
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

private fun formatTs(seconds: Long?): String {
    if (seconds == null || seconds <= 0L) return "Just now"
    val fmt = SimpleDateFormat("dd MMM, hh:mm a", Locale.ENGLISH)
    return fmt.format(Date(seconds * 1000L))
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OwnerOverviewPanel(
    snapshot: OwnerReportSnapshot,
    users: List<UserProfile>,
    isWide: Boolean,
    onJumpToAlerts: () -> Unit,
    onJumpToReports: () -> Unit,
    onJumpToFarmerDesk: () -> Unit
) {
    val emerald = MaterialTheme.colorScheme.primary
    val sage = Color(0xFF2E7D32)
    val amber = Color(0xFFD97706)
    val teal = Color(0xFF0F766E)
    val slate = Color(0xFF64748B)

    // System Alerts Summary Banner (Real open alerts, pending reports, open farmer queries)
    val totalActionItems = snapshot.unresolvedCriticalOrWarningCount + snapshot.pendingContentReports + snapshot.openQueries
    Card(
        modifier = Modifier.fillMaxWidth().testTag("owner_alerts_card"),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(
            containerColor = if (totalActionItems > 0) Color(0xFFFFFBEB) else MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
        ),
        border = BorderStroke(
            1.dp,
            if (totalActionItems > 0) Color(0xFFF59E0B) else MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)
        )
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = if (totalActionItems > 0) Icons.Filled.NotificationsActive else Icons.Filled.CheckCircle,
                    contentDescription = "System alerts status",
                    tint = if (totalActionItems > 0) Color(0xFFB45309) else emerald
                )
                Text(
                    text = if (totalActionItems > 0) {
                        "Important System Alerts ($totalActionItems items needing attention)"
                    } else {
                        "All Systems Healthy — Zero Unresolved Alerts"
                    },
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onJumpToAlerts,
                    modifier = Modifier
                        .heightIn(min = 48.dp)
                        .testTag("owner_alert_errors_btn")
                ) {
                    Text("Errors: ${snapshot.unresolvedCriticalOrWarningCount}", maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                OutlinedButton(
                    onClick = onJumpToReports,
                    modifier = Modifier
                        .heightIn(min = 48.dp)
                        .testTag("owner_alert_reports_btn")
                ) {
                    Text("Reports: ${snapshot.pendingContentReports}", maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                OutlinedButton(
                    onClick = onJumpToFarmerDesk,
                    modifier = Modifier
                        .heightIn(min = 48.dp)
                        .testTag("owner_alert_queries_btn")
                ) {
                    Text("Queries: ${snapshot.openQueries}", maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }

    // KPI Grid (2 cols on phone, 4 cols on tablet/desktop)
    val kpis = listOf(
        Triple("Total Users", "${snapshot.totalUsers}", "+${snapshot.newRegistrationsInPeriod} in ${snapshot.timeframe.label}") to (Icons.Filled.Groups to emerald),
        Triple("Active Users (7d)", "${snapshot.activeUsers7d}", "${snapshot.inactiveUsers} inactive accounts") to (Icons.Filled.Timeline to sage),
        Triple("Gemini AI Calls", "${snapshot.aiRequestsInPeriod}", String.format(Locale.ENGLISH, "Est. ₹%.2f ($%.4f)", snapshot.estimatedAiCostInr, snapshot.estimatedAiCostUsd)) to (Icons.Filled.AutoAwesome to teal),
        Triple("Farmer Queries", "${snapshot.totalFarmerQueries}", "${snapshot.openQueries} open • ${snapshot.resolvedQueries} resolved") to (Icons.Filled.SupportAgent to amber)
    )

    if (isWide) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            kpis.forEach { (textTriple, iconPair) ->
                OwnerKpiCard(
                    title = textTriple.first,
                    value = textTriple.second,
                    subtitle = textTriple.third,
                    icon = iconPair.first,
                    accentColor = iconPair.second,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            kpis.chunked(2).forEach { pair ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    pair.forEach { (textTriple, iconPair) ->
                        OwnerKpiCard(
                            title = textTriple.first,
                            value = textTriple.second,
                            subtitle = textTriple.third,
                            icon = iconPair.first,
                            accentColor = iconPair.second,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }

    // Charts Row (Side-by-side on wide screens, stacked on mobile)
    val activeDonut = @Composable { mod: Modifier ->
        SegmentedDonutChart(
            title = "Active vs Inactive Users (7-Day Window)",
            centerLabel = "Users",
            segments = listOf(
                DonutSegment("Active (7d)", snapshot.activeUsers7d, emerald),
                DonutSegment("Inactive", snapshot.inactiveUsers, slate)
            ),
            modifier = mod
        )
    }
    val roleDonut = @Composable { mod: Modifier ->
        SegmentedDonutChart(
            title = "Real-Time Registration Split",
            centerLabel = "Total",
            segments = listOf(
                DonutSegment("B.Sc Students", snapshot.studentCount, sage),
                DonutSegment("Farmers", snapshot.farmerCount, amber)
            ),
            modifier = mod
        )
    }

    if (isWide) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            activeDonut(Modifier.weight(1f))
            roleDonut(Modifier.weight(1f))
        }
    } else {
        activeDonut(Modifier.fillMaxWidth())
        roleDonut(Modifier.fillMaxWidth())
    }

    // Time-Series Bar Chart for Selected Report Period (Daily / Weekly / Monthly / All Time)
    TimeSeriesBarChart(
        title = "Platform Activity & AI Volume (${snapshot.timeframe.label})",
        subtitle = "Real logged activity events + Gemini AI interactions across 7 intervals",
        buckets = snapshot.activityTrend,
        barColor = emerald,
        modifier = Modifier.fillMaxWidth()
    )

    // Latest Registered Users Feed
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Recent Real-Time Registrations (${users.size})", style = MaterialTheme.typography.titleSmall)
            if (users.isEmpty()) {
                Text(
                    "No registered accounts yet. New student and farmer registrations appear here in real time.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                users.take(6).forEachIndexed { idx, user ->
                    if (idx > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(user.displayName.ifBlank { "Member" }, style = MaterialTheme.typography.labelLarge)
                            Text(
                                "${user.email} • ${user.institutionOrVillage.ifBlank { user.district.ifBlank { "India" } }}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "Joined ${formatTs(user.createdAt?.seconds)} • Last active ${formatTs(user.lastActiveAt?.seconds ?: user.updatedAt?.seconds)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        StatusPill(
                            label = user.role,
                            containerColor = if (user.role == "FARMER") Color(0xFFFEF3C7) else MaterialTheme.colorScheme.primaryContainer,
                            contentColor = if (user.role == "FARMER") Color(0xFF92400E) else MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun OwnerActivityAcademicsPanel(
    snapshot: OwnerReportSnapshot,
    activities: List<ActivityEvent>,
    materials: List<StudyMaterial>,
    examStats: List<ExamStat>,
    isWide: Boolean
) {
    val emerald = MaterialTheme.colorScheme.primary
    val amber = Color(0xFFD97706)
    val teal = Color(0xFF0F766E)

    val kpiRow = listOf(
        Triple("Activity Events", "${snapshot.activityEventsInPeriod}", "Student: ${snapshot.studentEventsInPeriod} • Farmer: ${snapshot.farmerEventsInPeriod}") to (Icons.Filled.Timeline to emerald),
        Triple("Study Materials", "${snapshot.totalStudyMaterials}", "+${snapshot.materialsAddedInPeriod} added in period") to (Icons.Filled.MenuBook to teal),
        Triple("Online Exams", "${snapshot.examAttemptsInPeriod}", "Avg ${snapshot.avgExamScorePct.roundToInt()}% • Pass ${snapshot.examPassRatePct.roundToInt()}%") to (Icons.Filled.Quiz to amber)
    )

    if (isWide) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            kpiRow.forEach { (triple, iconPair) ->
                OwnerKpiCard(triple.first, triple.second, triple.third, iconPair.first, iconPair.second, Modifier.weight(1f))
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            kpiRow.forEach { (triple, iconPair) ->
                OwnerKpiCard(triple.first, triple.second, triple.third, iconPair.first, iconPair.second, Modifier.fillMaxWidth())
            }
        }
    }

    // Study Material Upload Breakdown by Category
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Study Material Upload Tracking", style = MaterialTheme.typography.titleSmall)
            val totalMats = materials.size.coerceAtLeast(1)
            val categories = listOf(
                "NOTES_PDF" to "PDF Notes",
                "VIDEO_LECTURE" to "Video Lectures",
                "PYQ" to "Previous Year Questions",
                "PRACTICAL" to "Practical Lab Manuals"
            )
            categories.forEach { (code, label) ->
                val count = materials.count { it.category == code }
                HorizontalRatioBar(
                    label = label,
                    valueText = "$count uploads",
                    fraction = if (materials.isEmpty()) 0f else count.toFloat() / totalMats.toFloat(),
                    color = emerald
                )
            }
        }
    }

    // Online Exam Performance Breakdown by Semester
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Online Examination Statistics (${examStats.size} total attempts)", style = MaterialTheme.typography.titleSmall)
            if (examStats.isEmpty()) {
                Text(
                    "No online MCQ exam submissions recorded yet. Completed student tests appear automatically.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                val bySem = examStats.groupBy { it.semester }.toSortedMap()
                bySem.forEach { (sem, list) ->
                    val avg = list.map { it.percentage }.average()
                    HorizontalRatioBar(
                        label = "B.Sc Agri Semester $sem (${list.size} attempts)",
                        valueText = "Avg ${avg.roundToInt()}%",
                        fraction = (avg / 100.0).toFloat(),
                        color = if (avg >= 60.0) emerald else amber
                    )
                }
            }
        }
    }

    // Real-Time Student & Farmer Activity Stream
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Student & Farmer Activity Stream (${activities.size})", style = MaterialTheme.typography.titleSmall)
            if (activities.isEmpty()) {
                Text(
                    "No activity events logged yet. Sessions, exams, queries, posts, and uploads will stream here.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                activities.take(15).forEachIndexed { idx, ev ->
                    if (idx > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "${ev.eventType.replace('_', ' ')} • ${ev.module}",
                                style = MaterialTheme.typography.labelLarge
                            )
                            if (ev.detail.isNotBlank()) {
                                Text(ev.detail, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(
                                "${formatTs(ev.createdAt?.seconds)} • UID ${ev.userId.take(8)}…",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        StatusPill(
                            label = ev.userRole,
                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OwnerAiCloudHealthPanel(
    snapshot: OwnerReportSnapshot,
    aiLogs: List<AiUsageLog>,
    errorLogs: List<ErrorLog>,
    isWide: Boolean,
    onResolveError: (String, Boolean) -> Unit,
    onDeleteError: (String) -> Unit,
    onRunDiagnosticPing: () -> Unit
) {
    val emerald = MaterialTheme.colorScheme.primary
    val teal = Color(0xFF0F766E)
    val crimson = MaterialTheme.colorScheme.error
    val amber = Color(0xFFD97706)

    // 7. Gemini AI Usage & Cost Card
    val successRate = if (snapshot.aiRequestsInPeriod == 0) 100 else (snapshot.aiSuccessCount * 100 / snapshot.aiRequestsInPeriod)
    val aiKpis = listOf(
        Triple("AI Calls (${snapshot.timeframe.label})", "${snapshot.aiRequestsInPeriod}", "$successRate% success • ${snapshot.aiAvgLatencyMs}ms avg") to (Icons.Filled.AutoAwesome to teal),
        Triple("Tokens Consumed", "${snapshot.aiPromptTokens + snapshot.aiOutputTokens}", "In: ${snapshot.aiPromptTokens} • Out: ${snapshot.aiOutputTokens}") to (Icons.Filled.Timeline to emerald),
        Triple("Est. Gemini Cost", String.format(Locale.ENGLISH, "₹%.3f", snapshot.estimatedAiCostInr), String.format(Locale.ENGLISH, "$%.5f USD (Flash rate)", snapshot.estimatedAiCostUsd)) to (Icons.Filled.CloudQueue to amber)
    )

    if (isWide) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            aiKpis.forEach { (triple, iconPair) ->
                OwnerKpiCard(triple.first, triple.second, triple.third, iconPair.first, iconPair.second, Modifier.weight(1f))
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            aiKpis.forEach { (triple, iconPair) ->
                OwnerKpiCard(triple.first, triple.second, triple.third, iconPair.first, iconPair.second, Modifier.fillMaxWidth())
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Recent Gemini AI Requests (${aiLogs.size})", style = MaterialTheme.typography.titleSmall)
            Text(
                "Cost estimate uses public Gemini Flash reference rates ($0.10/1M input, $0.40/1M output, ₹84/USD). Verify official billing in Google Cloud Console.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (aiLogs.isEmpty()) {
                Text(
                    "No Gemini AI requests logged yet. Calls from AI Assistant and Farmer Crop Photo Scan appear here.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                aiLogs.take(10).forEachIndexed { idx, log ->
                    if (idx > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "${log.feature.replace('_', ' ')} (${log.language}) ${if (log.hasImage) "• Vision" else ""}",
                                style = MaterialTheme.typography.labelLarge
                            )
                            Text(
                                "${log.modelName} • ${log.promptTokens} in / ${log.outputTokens} out • ${log.latencyMs}ms",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(formatTs(log.createdAt?.seconds), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        StatusPill(
                            label = if (log.success) "OK" else "FAIL",
                            containerColor = if (log.success) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer,
                            contentColor = if (log.success) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }
    }

    // 8. Firebase Database & Storage Usage
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Firebase Database & Storage Usage",
                    style = MaterialTheme.typography.titleSmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Spacer(Modifier.width(8.dp))
                StatusPill(
                    label = formatByteSize(snapshot.estimatedFirestoreBytes),
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            val freeTierBytes = 1024.0 * 1024.0 * 1024.0 // 1 GiB Spark Enterprise Free Tier
            val usageRatio = (snapshot.estimatedFirestoreBytes.toDouble() / freeTierBytes).toFloat()
            HorizontalRatioBar(
                label = "Firestore Monitored Footprint (${snapshot.totalFirestoreDocuments} docs vs 1 GiB tier)",
                valueText = "${formatByteSize(snapshot.estimatedFirestoreBytes)} / 1 GiB",
                fraction = usageRatio,
                color = emerald
            )
            snapshot.collectionFootprints.forEach { fp ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(fp.collectionName, style = MaterialTheme.typography.bodySmall)
                    Text(
                        "${fp.documentCount} docs • ${formatByteSize(fp.estimatedBytes)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Text(
                "Cloud Storage Bucket Status: Not provisioned on this project (0 B used). Crop photos are analyzed via Gemini AI on-device/in-memory without uploading raw media blobs, keeping storage costs at ₹0.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }

    // 9. Application Error Logs & System Health
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Filled.HealthAndSafety, contentDescription = null, tint = emerald)
                    Text(
                        "Error Logs & System Health (${errorLogs.size})",
                        style = MaterialTheme.typography.titleSmall,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(Modifier.width(8.dp))
                OutlinedButton(
                    onClick = onRunDiagnosticPing,
                    modifier = Modifier
                        .heightIn(min = 48.dp)
                        .testTag("owner_health_ping_button")
                ) {
                    Text("Test Ping", maxLines = 1)
                }
            }

            if (errorLogs.isEmpty()) {
                EmptyStateCard(
                    title = "Zero Application Errors Logged",
                    description = "Firestore permission issues, AI timeouts, and system diagnostics will appear here automatically.",
                    icon = Icons.Filled.BugReport
                )
            } else {
                errorLogs.take(20).forEach { err ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = if (err.resolved) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                            else if (err.severity == "CRITICAL") MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.45f)
                            else Color(0xFFFFFBEB)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                StatusPill(
                                    label = "${err.severity} • ${err.source}",
                                    containerColor = when {
                                        err.resolved -> MaterialTheme.colorScheme.surfaceVariant
                                        err.severity == "CRITICAL" -> crimson
                                        err.severity == "WARNING" -> amber
                                        else -> emerald
                                    },
                                    contentColor = if (err.resolved) MaterialTheme.colorScheme.onSurfaceVariant else Color.White
                                )
                                Text(formatTs(err.createdAt?.seconds), style = MaterialTheme.typography.labelSmall)
                            }
                            Text(err.module, style = MaterialTheme.typography.labelLarge)
                            Text(err.message, style = MaterialTheme.typography.bodySmall)
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { onResolveError(err.id, !err.resolved) },
                                    modifier = Modifier
                                        .heightIn(min = 48.dp)
                                        .testTag("owner_resolve_err_${err.id}")
                                ) {
                                    Text(if (err.resolved) "Reopen" else "Mark Resolved")
                                }
                                TextButton(
                                    onClick = { onDeleteError(err.id) },
                                    modifier = Modifier.heightIn(min = 48.dp)
                                ) {
                                    Text("Delete", color = crimson)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OwnerDeskModerationPanel(
    snapshot: OwnerReportSnapshot,
    queries: List<FarmerQuery>,
    reports: List<ContentReport>,
    busy: Boolean,
    onReplyFarmerQuery: (String, String, String) -> Unit,
    onDismissReport: (String) -> Unit,
    onHidePostAndResolve: (ContentReport) -> Unit
) {
    val emerald = MaterialTheme.colorScheme.primary
    val amber = Color(0xFFD97706)
    val crimson = MaterialTheme.colorScheme.error

    // 4. Farmer Support Query Tracking Funnel
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Farmer Support Query Tracking (${snapshot.totalFarmerQueries})", style = MaterialTheme.typography.titleSmall)
            val total = snapshot.totalFarmerQueries.coerceAtLeast(1).toFloat()
            HorizontalRatioBar("Open (Awaiting Triage)", "${snapshot.openQueries}", if (snapshot.totalFarmerQueries == 0) 0f else snapshot.openQueries / total, crimson)
            HorizontalRatioBar("In Review", "${snapshot.inReviewQueries}", if (snapshot.totalFarmerQueries == 0) 0f else snapshot.inReviewQueries / total, amber)
            HorizontalRatioBar("Resolved", "${snapshot.resolvedQueries}", if (snapshot.totalFarmerQueries == 0) 0f else snapshot.resolvedQueries / total, emerald)
        }
    }

    if (queries.isEmpty()) {
        EmptyStateCard(
            title = "No Farmer Queries Submitted",
            description = "When farmers submit crop disease or fertilizer queries, track and reply directly here.",
            icon = Icons.Filled.SupportAgent
        )
    } else {
        queries.take(12).forEach { q ->
            var replyText by remember(q.id, q.adminReply) { mutableStateOf(q.adminReply) }
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${q.cropName} (${q.category})",
                            style = MaterialTheme.typography.titleSmall,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        Spacer(Modifier.width(8.dp))
                        StatusPill(
                            label = q.status,
                            containerColor = when (q.status) {
                                "RESOLVED" -> MaterialTheme.colorScheme.primaryContainer
                                "IN_REVIEW" -> Color(0xFFFEF3C7)
                                else -> MaterialTheme.colorScheme.errorContainer
                            },
                            contentColor = when (q.status) {
                                "RESOLVED" -> MaterialTheme.colorScheme.onPrimaryContainer
                                "IN_REVIEW" -> Color(0xFF92400E)
                                else -> MaterialTheme.colorScheme.onErrorContainer
                            }
                        )
                    }
                    Text("${q.farmerName} • ${q.district.ifBlank { "India" }} • ${formatTs(q.createdAt?.seconds)}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(q.description, style = MaterialTheme.typography.bodySmall)
                    if (q.imageSummary.isNotBlank()) {
                        Text("AI Photo Scan: ${q.imageSummary}", style = MaterialTheme.typography.labelSmall, color = emerald)
                    }
                    OutlinedTextField(
                        value = replyText,
                        onValueChange = { replyText = it },
                        label = { Text("Agronomist / Owner Reply") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        OutlinedButton(
                            onClick = { onReplyFarmerQuery(q.id, "IN_REVIEW", replyText) },
                            enabled = !busy,
                            modifier = Modifier.heightIn(min = 48.dp)
                        ) { Text("In Review") }
                        Button(
                            onClick = { onReplyFarmerQuery(q.id, "RESOLVED", replyText) },
                            enabled = !busy,
                            modifier = Modifier.heightIn(min = 48.dp)
                        ) { Text("Mark Resolved") }
                    }
                }
            }
        }
    }

    // Reported Content Queue
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Filled.Flag, contentDescription = null, tint = amber)
                Text("Reported Content Moderation Queue (${reports.size})", style = MaterialTheme.typography.titleSmall)
            }
            if (reports.isEmpty()) {
                Text(
                    "No community posts have been reported. Member reports appear here immediately for Owner review.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                reports.forEach { rep ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f))
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(rep.targetTitle, style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
                                StatusPill(
                                    label = rep.status,
                                    containerColor = if (rep.status == "PENDING") Color(0xFFFEF3C7) else MaterialTheme.colorScheme.primaryContainer,
                                    contentColor = if (rep.status == "PENDING") Color(0xFF92400E) else MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                            Text("Reported by ${rep.reporterName} • ${formatTs(rep.createdAt?.seconds)}", style = MaterialTheme.typography.labelSmall)
                            Text("Reason: ${rep.reason}", style = MaterialTheme.typography.bodySmall)
                            if (rep.status == "PENDING") {
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Button(
                                        onClick = { onHidePostAndResolve(rep) },
                                        enabled = !busy,
                                        colors = ButtonDefaults.buttonColors(containerColor = crimson),
                                        modifier = Modifier
                                            .heightIn(min = 48.dp)
                                            .testTag("owner_hide_report_${rep.id}")
                                    ) { Text("Hide Post & Close") }
                                    OutlinedButton(
                                        onClick = { onDismissReport(rep.id) },
                                        enabled = !busy,
                                        modifier = Modifier
                                            .heightIn(min = 48.dp)
                                            .testTag("owner_dismiss_report_${rep.id}")
                                    ) { Text("Dismiss") }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OwnerControlsGovernancePanel(
    appSettings: AppSettings,
    admins: List<AdminRecord>,
    announcements: List<Announcement>,
    auditLogs: List<AdminAuditLog> = emptyList(),
    busy: Boolean,
    onSaveSettings: (AppSettings, String) -> Unit,
    onGrantStaff: (String, String, String, () -> Unit) -> Unit,
    onRevokeStaff: (String) -> Unit,
    onBroadcastAnnouncement: (String, String, String, () -> Unit) -> Unit,
    onDeleteAnnouncement: (String) -> Unit
) {
    // 1. Live Platform Feature Toggles (Enable / Disable Modules)
    Card(
        modifier = Modifier.fillMaxWidth().testTag("owner_feature_flags_card"),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Platform Module Feature Flags", style = MaterialTheme.typography.titleSmall)
            Text(
                "Toggle any Guru Ji Vision module live for all users. Changes sync immediately via Firestore.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            @Composable
            fun FlagRow(label: String, subtitle: String, checked: Boolean, tag: String, onToggle: (Boolean) -> Unit) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(label, style = MaterialTheme.typography.labelLarge)
                        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = checked,
                        onCheckedChange = onToggle,
                        enabled = !busy,
                        modifier = Modifier.testTag(tag)
                    )
                }
            }

            FlagRow("B.Sc Student Portal", "Notes, lectures, PYQs & MCQ exams", appSettings.studentModuleEnabled, "flag_student") {
                onSaveSettings(appSettings.copy(studentModuleEnabled = it), "Student Portal ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Student Money Manager", "Private INR ledger & savings goals", appSettings.moneyManagerEnabled, "flag_money") {
                onSaveSettings(appSettings.copy(moneyManagerEnabled = it), "Money Manager ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Farmer Portal & Query Desk", "Crop diseases, IPM & support queries", appSettings.farmerModuleEnabled, "flag_farmer") {
                onSaveSettings(appSettings.copy(farmerModuleEnabled = it), "Farmer Portal ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Agriculture Calculators", "NPK fertilizer, seed rate & spacing tools", appSettings.toolsModuleEnabled, "flag_tools") {
                onSaveSettings(appSettings.copy(toolsModuleEnabled = it), "Agri Tools ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Gemini AI Agriculture Assistant", "Bilingual AI Q&A & crop vision scan", appSettings.aiAssistantEnabled, "flag_ai") {
                onSaveSettings(appSettings.copy(aiAssistantEnabled = it), "AI Assistant ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Career & Scholarships", "Govt/private agri jobs & ICAR alerts", appSettings.careerModuleEnabled, "flag_career") {
                onSaveSettings(appSettings.copy(careerModuleEnabled = it), "Career Portal ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Community Discussion Forum", "College groups & doubt solving", appSettings.communityModuleEnabled, "flag_community") {
                onSaveSettings(appSettings.copy(communityModuleEnabled = it), "Community Forum ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Meeting Zone (Google Meet)", "Live faculty classes & Google Meet sessions", appSettings.meetingZoneEnabled, "flag_meeting_zone") {
                onSaveSettings(appSettings.copy(meetingZoneEnabled = it), "Meeting Zone ${if (it) "enabled" else "paused"}.")
            }
            FlagRow("Doubt Zone – Ask Your Professor", "Private 1-on-1 student–professor chat support", appSettings.doubtZoneEnabled, "flag_doubt_zone") {
                onSaveSettings(appSettings.copy(doubtZoneEnabled = it), "Doubt Zone ${if (it) "enabled" else "paused"}.")
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            var bannerText by remember(appSettings.maintenanceBanner) { mutableStateOf(appSettings.maintenanceBanner) }
            OutlinedTextField(
                value = bannerText,
                onValueChange = { bannerText = it },
                label = { Text("Global Maintenance / Priority Notice Banner (blank = hidden)") },
                modifier = Modifier.fillMaxWidth().testTag("owner_maintenance_banner_input")
            )
            Button(
                onClick = { onSaveSettings(appSettings.copy(maintenanceBanner = bannerText), "Maintenance notice updated.") },
                enabled = !busy,
                modifier = Modifier.testTag("owner_save_banner_button")
            ) {
                Text("Save Notice Banner")
            }
        }
    }

    // 2. Broadcast Announcements & Notifications
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Filled.Campaign, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Text("Send Announcements & Notifications", style = MaterialTheme.typography.titleSmall)
            }
            var title by remember { mutableStateOf("") }
            var msg by remember { mutableStateOf("") }
            var audience by remember { mutableStateOf("ALL") }

            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("ALL", "STUDENTS", "FARMERS").forEach { aud ->
                    FilterChip(
                        selected = audience == aud,
                        onClick = { audience = aud },
                        label = { Text(aud) }
                    )
                }
            }
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Announcement Title") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().testTag("owner_ann_title_input")
            )
            OutlinedTextField(
                value = msg,
                onValueChange = { msg = it },
                label = { Text("Message Body") },
                minLines = 2,
                modifier = Modifier.fillMaxWidth().testTag("owner_ann_msg_input")
            )
            Button(
                onClick = {
                    onBroadcastAnnouncement(title, msg, audience) {
                        title = ""
                        msg = ""
                    }
                },
                enabled = !busy && title.trim().length >= 2 && msg.trim().length >= 3,
                modifier = Modifier.testTag("owner_ann_send_button")
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Broadcast Live")
            }

            if (announcements.isNotEmpty()) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                announcements.take(5).forEach { ann ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("${ann.title} (${ann.audience})", style = MaterialTheme.typography.labelLarge)
                            Text(ann.message, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        IconButton(onClick = { onDeleteAnnouncement(ann.id) }) {
                            Icon(Icons.Filled.Delete, contentDescription = "Delete announcement", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
    }

    // 3. Super Admin Only: Manage Administrators & Staff Permissions
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Administrator & Staff Permissions (Owner Only)", style = MaterialTheme.typography.titleSmall)
            Text(
                "Only the verified Platform Owner can grant or revoke staff admin roles. Staff can manage content & queries, never Owner telemetry or student finances.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            var staffUid by remember { mutableStateOf("") }
            var staffEmail by remember { mutableStateOf("") }
            var roleTitle by remember { mutableStateOf("Content Moderator") }

            OutlinedTextField(
                value = staffUid,
                onValueChange = { staffUid = it },
                label = { Text("Staff Firebase UID") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().testTag("owner_staff_uid_input")
            )
            OutlinedTextField(
                value = staffEmail,
                onValueChange = { staffEmail = it },
                label = { Text("Staff Google Email") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().testTag("owner_staff_email_input")
            )
            OutlinedTextField(
                value = roleTitle,
                onValueChange = { roleTitle = it },
                label = { Text("Role Permission Title (e.g., Agronomist, Content Admin)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Button(
                onClick = {
                    onGrantStaff(staffUid, staffEmail, roleTitle) {
                        staffUid = ""
                        staffEmail = ""
                    }
                },
                enabled = !busy && staffUid.isNotBlank() && staffEmail.contains("@"),
                modifier = Modifier.testTag("owner_grant_staff_button")
            ) {
                Text("Grant Staff Permission")
            }

            if (admins.isNotEmpty()) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                admins.forEach { adm ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("${adm.email} (${adm.roleTitle})", style = MaterialTheme.typography.labelLarge)
                            Text("UID: ${adm.id}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        IconButton(onClick = { onRevokeStaff(adm.id) }) {
                            Icon(Icons.Filled.Delete, contentDescription = "Revoke staff admin", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
    }

    // 4. WhatsApp Support & Website Branding Settings
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("WhatsApp Desk & Ecosystem Settings", style = MaterialTheme.typography.titleSmall)
            var waGroupUrl by remember(appSettings.whatsappGroupInviteUrl) { mutableStateOf(appSettings.whatsappGroupInviteUrl) }
            var wa by remember(appSettings.whatsappNumber) { mutableStateOf(appSettings.whatsappNumber) }
            var email by remember(appSettings.supportEmail) { mutableStateOf(appSettings.supportEmail) }
            var headline by remember(appSettings.heroHeadline) { mutableStateOf(appSettings.heroHeadline) }
            var about by remember(appSettings.aboutText) { mutableStateOf(appSettings.aboutText) }

            OutlinedTextField(
                value = waGroupUrl,
                onValueChange = { waGroupUrl = it },
                label = { Text("Official WhatsApp Group Invite URL") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().testTag("owner_wa_group_url_input")
            )
            OutlinedTextField(value = wa, onValueChange = { wa = it }, label = { Text("WhatsApp Support Number") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Support Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = headline, onValueChange = { headline = it }, label = { Text("Home Hero Headline") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = about, onValueChange = { about = it }, label = { Text("About Guru Ji Vision") }, minLines = 3, modifier = Modifier.fillMaxWidth())
            Button(
                onClick = {
                    onSaveSettings(
                        appSettings.copy(
                            whatsappNumber = wa,
                            whatsappGroupInviteUrl = waGroupUrl,
                            supportEmail = email,
                            heroHeadline = headline,
                            aboutText = about
                        ),
                        "WhatsApp Group & branding settings saved."
                    )
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth().testTag("owner_save_settings_button")
            ) {
                Text("Save Platform Settings")
            }
        }
    }

    // 5. Immutable Administrative Audit Log
    Card(
        modifier = Modifier.fillMaxWidth().testTag("owner_audit_log_card"),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Filled.History, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Text("Immutable Administrative Audit Log (${auditLogs.size})", style = MaterialTheme.typography.titleSmall)
            }
            Text(
                "Append-only Firestore audit trail of Founder / Owner administrative actions. Updates and deletions are permanently blocked in security rules.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (auditLogs.isEmpty()) {
                Text(
                    "No administrative actions logged yet. Module toggles, announcements, settings changes, and moderation actions appear here automatically.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                auditLogs.take(15).forEachIndexed { idx, log ->
                    if (idx > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(log.action.replace('_', ' '), style = MaterialTheme.typography.labelLarge)
                            if (log.summary.isNotBlank()) {
                                Text(log.summary, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(
                                "${log.actorEmail.ifBlank { log.actorUid }} • ${formatTs(log.createdAt?.seconds)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        StatusPill(
                            label = log.targetType,
                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }
        }
    }
}
