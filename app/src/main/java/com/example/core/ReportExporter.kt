package com.example.core

import android.content.Context
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.net.Uri
import com.example.data.model.ActivityEvent
import com.example.data.model.AdminRecord
import com.example.data.model.AiUsageLog
import com.example.data.model.Announcement
import com.example.data.model.CareerOpportunity
import com.example.data.model.CommunityPost
import com.example.data.model.ContentReport
import com.example.data.model.ErrorLog
import com.example.data.model.ExamStat
import com.example.data.model.FarmerQuery
import com.example.data.model.QuizQuestion
import com.example.data.model.StudyMaterial
import com.example.data.model.UserProfile
import java.io.OutputStreamWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

enum class ReportTimeframe(val label: String, val windowSeconds: Long?) {
    DAILY_24H("Daily (24h)", 86_400L),
    WEEKLY_7D("Weekly (7d)", 604_800L),
    MONTHLY_30D("Monthly (30d)", 2_592_000L),
    ALL_TIME("All Time", null)
}

data class CollectionFootprint(
    val collectionName: String,
    val documentCount: Int,
    val estimatedBytes: Long
)

data class TrendBucket(
    val label: String,
    val count: Int
)

data class OwnerReportSnapshot(
    val timeframe: ReportTimeframe,
    val generatedAtLabel: String,
    val totalUsers: Int,
    val newRegistrationsInPeriod: Int,
    val studentCount: Int,
    val farmerCount: Int,
    val activeUsers7d: Int,
    val inactiveUsers: Int,
    val activityEventsInPeriod: Int,
    val studentEventsInPeriod: Int,
    val farmerEventsInPeriod: Int,
    val totalFarmerQueries: Int,
    val openQueries: Int,
    val inReviewQueries: Int,
    val resolvedQueries: Int,
    val totalStudyMaterials: Int,
    val materialsAddedInPeriod: Int,
    val totalQuizQuestions: Int,
    val examAttemptsInPeriod: Int,
    val avgExamScorePct: Double,
    val examPassRatePct: Double,
    val aiRequestsInPeriod: Int,
    val aiSuccessCount: Int,
    val aiPromptTokens: Long,
    val aiOutputTokens: Long,
    val aiAvgLatencyMs: Long,
    val estimatedAiCostUsd: Double,
    val estimatedAiCostInr: Double,
    val totalErrorsInPeriod: Int,
    val unresolvedCriticalOrWarningCount: Int,
    val pendingContentReports: Int,
    val activeCommunityPosts: Int,
    val hiddenCommunityPosts: Int,
    val totalFirestoreDocuments: Int,
    val estimatedFirestoreBytes: Long,
    val collectionFootprints: List<CollectionFootprint>,
    val activityTrend: List<TrendBucket>
)

// Reference Gemini Flash pricing estimate ($0.10 / 1M input tokens, $0.40 / 1M output tokens, INR ~84/USD)
private const val INPUT_USD_PER_MILLION = 0.10
private const val OUTPUT_USD_PER_MILLION = 0.40
private const val USD_TO_INR_ESTIMATE = 84.0

fun buildOwnerReportSnapshot(
    timeframe: ReportTimeframe,
    users: List<UserProfile>,
    activities: List<ActivityEvent>,
    queries: List<FarmerQuery>,
    materials: List<StudyMaterial>,
    quizzes: List<QuizQuestion>,
    examStats: List<ExamStat>,
    aiLogs: List<AiUsageLog>,
    errorLogs: List<ErrorLog>,
    reports: List<ContentReport>,
    careers: List<CareerOpportunity>,
    posts: List<CommunityPost>,
    announcements: List<Announcement>,
    admins: List<AdminRecord>
): OwnerReportSnapshot {
    val nowSec = System.currentTimeMillis() / 1000L
    val cutoffSec = timeframe.windowSeconds?.let { nowSec - it } ?: 0L
    val activeCutoffSec = nowSec - 604_800L // Active in last 7 days

    fun inWindow(seconds: Long?): Boolean {
        if (timeframe.windowSeconds == null) return true
        return (seconds ?: 0L) >= cutoffSec
    }

    val newRegs = users.count { inWindow(it.createdAt?.seconds) }
    val students = users.count { it.role == "STUDENT" }
    val farmers = users.count { it.role == "FARMER" }
    val activeUsers = users.count {
        val lastSeen = it.lastActiveAt?.seconds ?: it.updatedAt?.seconds ?: it.createdAt?.seconds ?: 0L
        lastSeen >= activeCutoffSec
    }
    val inactiveUsers = (users.size - activeUsers).coerceAtLeast(0)

    val periodActivities = activities.filter { inWindow(it.createdAt?.seconds) }
    val studentEvents = periodActivities.count { it.userRole == "STUDENT" }
    val farmerEvents = periodActivities.count { it.userRole == "FARMER" }

    val openQ = queries.count { it.status == "OPEN" }
    val inReviewQ = queries.count { it.status == "IN_REVIEW" }
    val resolvedQ = queries.count { it.status == "RESOLVED" }

    val matsInPeriod = materials.count { inWindow(it.createdAt?.seconds) }

    val periodExams = examStats.filter { inWindow(it.createdAt?.seconds) }
    val avgPct = if (periodExams.isEmpty()) 0.0 else periodExams.map { it.percentage }.average()
    val passRate = if (periodExams.isEmpty()) 0.0 else (periodExams.count { it.percentage >= 40L } * 100.0 / periodExams.size)

    val periodAi = aiLogs.filter { inWindow(it.createdAt?.seconds) }
    val aiSuccess = periodAi.count { it.success }
    val promptTokens = periodAi.sumOf { it.promptTokens }
    val outputTokens = periodAi.sumOf { it.outputTokens }
    val avgLatency = if (periodAi.isEmpty()) 0L else periodAi.sumOf { it.latencyMs } / periodAi.size
    val costUsd = (promptTokens / 1_000_000.0) * INPUT_USD_PER_MILLION +
        (outputTokens / 1_000_000.0) * OUTPUT_USD_PER_MILLION
    val costInr = costUsd * USD_TO_INR_ESTIMATE

    val periodErrors = errorLogs.filter { inWindow(it.createdAt?.seconds) }
    val unresolvedAlerts = errorLogs.count { !it.resolved && (it.severity == "CRITICAL" || it.severity == "WARNING") }
    val pendingReports = reports.count { it.status == "PENDING" }

    // Real estimated serialized byte footprint per monitored Firestore collection
    // (excludes private student /transactions & /budgets which are isolated from Owner)
    fun estimateStr(s: String): Long = s.toByteArray(Charsets.UTF_8).size.toLong()
    val footprints = listOf(
        CollectionFootprint(
            "users",
            users.size,
            users.sumOf { 180L + estimateStr(it.displayName) + estimateStr(it.email) + estimateStr(it.institutionOrVillage) + estimateStr(it.district) }
        ),
        CollectionFootprint(
            "farmerQueries",
            queries.size,
            queries.sumOf { 220L + estimateStr(it.cropName) + estimateStr(it.description) + estimateStr(it.imageSummary) + estimateStr(it.adminReply) }
        ),
        CollectionFootprint(
            "studyMaterials",
            materials.size,
            materials.sumOf { 200L + estimateStr(it.title) + estimateStr(it.subject) + estimateStr(it.summary) + estimateStr(it.resourceUrl) }
        ),
        CollectionFootprint(
            "quizzes",
            quizzes.size,
            quizzes.sumOf { 220L + estimateStr(it.title) + estimateStr(it.questionText) + estimateStr(it.explanation) + it.options.sumOf { opt -> estimateStr(opt) } }
        ),
        CollectionFootprint(
            "communityPosts",
            posts.size,
            posts.sumOf { 180L + estimateStr(it.title) + estimateStr(it.body) + estimateStr(it.collegeGroup) }
        ),
        CollectionFootprint(
            "careerOpportunities",
            careers.size,
            careers.sumOf { 200L + estimateStr(it.title) + estimateStr(it.organization) + estimateStr(it.description) }
        ),
        CollectionFootprint(
            "activityEvents",
            activities.size,
            activities.sumOf { 140L + estimateStr(it.detail) }
        ),
        CollectionFootprint(
            "aiUsageLogs",
            aiLogs.size,
            aiLogs.sumOf { 180L + estimateStr(it.modelName) }
        ),
        CollectionFootprint(
            "examStats",
            examStats.size,
            examStats.size * 140L
        ),
        CollectionFootprint(
            "errorLogs",
            errorLogs.size,
            errorLogs.sumOf { 160L + estimateStr(it.module) + estimateStr(it.message) }
        ),
        CollectionFootprint(
            "contentReports",
            reports.size,
            reports.sumOf { 180L + estimateStr(it.targetTitle) + estimateStr(it.reason) }
        ),
        CollectionFootprint(
            "announcements & admins",
            announcements.size + admins.size + 1,
            announcements.sumOf { 160L + estimateStr(it.title) + estimateStr(it.message) } + admins.size * 140L + 512L
        )
    )

    val totalDocs = footprints.sumOf { it.documentCount }
    val totalBytes = footprints.sumOf { it.estimatedBytes }

    // Build 7-bucket trend from real event timestamps in selected period
    val bucketCount = 7
    val spanSeconds = when (timeframe) {
        ReportTimeframe.DAILY_24H -> 86_400L
        ReportTimeframe.WEEKLY_7D -> 604_800L
        ReportTimeframe.MONTHLY_30D -> 2_592_000L
        ReportTimeframe.ALL_TIME -> 2_592_000L
    }
    val stepSec = (spanSeconds / bucketCount).coerceAtLeast(3600L)
    val startSec = nowSec - (stepSec * bucketCount)
    val dayFmt = SimpleDateFormat(
        if (timeframe == ReportTimeframe.DAILY_24H) "HH:mm" else "dd MMM",
        Locale.ENGLISH
    )

    val trend = (0 until bucketCount).map { idx ->
        val bStart = startSec + idx * stepSec
        val bEnd = bStart + stepSec
        val c = activities.count { ev ->
            val ts = ev.createdAt?.seconds ?: 0L
            ts in bStart until bEnd
        } + aiLogs.count { log ->
            val ts = log.createdAt?.seconds ?: 0L
            ts in bStart until bEnd
        }
        TrendBucket(label = dayFmt.format(Date(bStart * 1000L)), count = c)
    }

    val genFmt = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.ENGLISH)

    return OwnerReportSnapshot(
        timeframe = timeframe,
        generatedAtLabel = genFmt.format(Date()),
        totalUsers = users.size,
        newRegistrationsInPeriod = newRegs,
        studentCount = students,
        farmerCount = farmers,
        activeUsers7d = activeUsers,
        inactiveUsers = inactiveUsers,
        activityEventsInPeriod = periodActivities.size,
        studentEventsInPeriod = studentEvents,
        farmerEventsInPeriod = farmerEvents,
        totalFarmerQueries = queries.size,
        openQueries = openQ,
        inReviewQueries = inReviewQ,
        resolvedQueries = resolvedQ,
        totalStudyMaterials = materials.size,
        materialsAddedInPeriod = matsInPeriod,
        totalQuizQuestions = quizzes.size,
        examAttemptsInPeriod = periodExams.size,
        avgExamScorePct = avgPct,
        examPassRatePct = passRate,
        aiRequestsInPeriod = periodAi.size,
        aiSuccessCount = aiSuccess,
        aiPromptTokens = promptTokens,
        aiOutputTokens = outputTokens,
        aiAvgLatencyMs = avgLatency,
        estimatedAiCostUsd = costUsd,
        estimatedAiCostInr = costInr,
        totalErrorsInPeriod = periodErrors.size,
        unresolvedCriticalOrWarningCount = unresolvedAlerts,
        pendingContentReports = pendingReports,
        activeCommunityPosts = posts.count { it.status == "ACTIVE" },
        hiddenCommunityPosts = posts.count { it.status == "HIDDEN" },
        totalFirestoreDocuments = totalDocs,
        estimatedFirestoreBytes = totalBytes,
        collectionFootprints = footprints,
        activityTrend = trend
    )
}

fun formatByteSize(bytes: Long): String {
    return when {
        bytes < 1024L -> "$bytes B"
        bytes < 1024L * 1024L -> String.format(Locale.ENGLISH, "%.1f KB", bytes / 1024.0)
        else -> String.format(Locale.ENGLISH, "%.2f MB", bytes / (1024.0 * 1024.0))
    }
}

fun writeCsvReport(context: Context, uri: Uri, snapshot: OwnerReportSnapshot): Result<Unit> {
    return try {
        val stream = context.contentResolver.openOutputStream(uri)
            ?: return Result.failure(IllegalStateException("Unable to open destination file."))
        stream.use { out ->
            OutputStreamWriter(out, Charsets.UTF_8).use { w ->
                w.appendLine("Guru Ji Vision - Owner Monitoring & Control Report")
                w.appendLine("Generated At,\"${snapshot.generatedAtLabel}\"")
                w.appendLine("Timeframe,\"${snapshot.timeframe.label}\"")
                w.appendLine("Privacy Guard,\"Private student financial records (/transactions & /budgets) are excluded by design.\"")
                w.appendLine()
                w.appendLine("Category,Metric,Value")
                w.appendLine("Users,Total Registered Users,${snapshot.totalUsers}")
                w.appendLine("Users,New Registrations (${snapshot.timeframe.label}),${snapshot.newRegistrationsInPeriod}")
                w.appendLine("Users,B.Sc Agriculture Students,${snapshot.studentCount}")
                w.appendLine("Users,Farmers,${snapshot.farmerCount}")
                w.appendLine("Users,Active Users (Last 7d),${snapshot.activeUsers7d}")
                w.appendLine("Users,Inactive Users,${snapshot.inactiveUsers}")
                w.appendLine("Activity,Total Activity Events,${snapshot.activityEventsInPeriod}")
                w.appendLine("Activity,Student Events,${snapshot.studentEventsInPeriod}")
                w.appendLine("Activity,Farmer Events,${snapshot.farmerEventsInPeriod}")
                w.appendLine("Farmer Desk,Total Queries,${snapshot.totalFarmerQueries}")
                w.appendLine("Farmer Desk,Open Queries,${snapshot.openQueries}")
                w.appendLine("Farmer Desk,In Review Queries,${snapshot.inReviewQueries}")
                w.appendLine("Farmer Desk,Resolved Queries,${snapshot.resolvedQueries}")
                w.appendLine("Academics,Total Study Materials,${snapshot.totalStudyMaterials}")
                w.appendLine("Academics,Materials Added (${snapshot.timeframe.label}),${snapshot.materialsAddedInPeriod}")
                w.appendLine("Academics,Published MCQ Questions,${snapshot.totalQuizQuestions}")
                w.appendLine("Exams,Exam Completions (${snapshot.timeframe.label}),${snapshot.examAttemptsInPeriod}")
                w.appendLine("Exams,Average Score %,${String.format(Locale.ENGLISH, "%.1f", snapshot.avgExamScorePct)}")
                w.appendLine("Exams,Pass Rate (>=40%) %,${String.format(Locale.ENGLISH, "%.1f", snapshot.examPassRatePct)}")
                w.appendLine("Gemini AI,Total Requests,${snapshot.aiRequestsInPeriod}")
                w.appendLine("Gemini AI,Successful Responses,${snapshot.aiSuccessCount}")
                w.appendLine("Gemini AI,Prompt Tokens,${snapshot.aiPromptTokens}")
                w.appendLine("Gemini AI,Output Tokens,${snapshot.aiOutputTokens}")
                w.appendLine("Gemini AI,Average Latency (ms),${snapshot.aiAvgLatencyMs}")
                w.appendLine("Gemini AI,Estimated Cost (USD),${String.format(Locale.ENGLISH, "%.5f", snapshot.estimatedAiCostUsd)}")
                w.appendLine("Gemini AI,Estimated Cost (INR),${String.format(Locale.ENGLISH, "%.3f", snapshot.estimatedAiCostInr)}")
                w.appendLine("System Health,Error Logs (${snapshot.timeframe.label}),${snapshot.totalErrorsInPeriod}")
                w.appendLine("System Health,Unresolved Alerts,${snapshot.unresolvedCriticalOrWarningCount}")
                w.appendLine("Moderation,Pending Content Reports,${snapshot.pendingContentReports}")
                w.appendLine("Firestore,Monitored Documents,${snapshot.totalFirestoreDocuments}")
                w.appendLine("Firestore,Estimated Payload Size,\"${formatByteSize(snapshot.estimatedFirestoreBytes)}\"")
                w.appendLine()
                w.appendLine("Collection,Document Count,Estimated Size")
                snapshot.collectionFootprints.forEach { fp ->
                    w.appendLine("\"${fp.collectionName}\",${fp.documentCount},\"${formatByteSize(fp.estimatedBytes)}\"")
                }
            }
        }
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }
}

fun writePdfReport(context: Context, uri: Uri, snapshot: OwnerReportSnapshot): Result<Unit> {
    val pdf = PdfDocument()
    return try {
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 at 72dpi
        val page = pdf.startPage(pageInfo)
        val canvas = page.canvas

        val headerBg = Paint().apply { color = Color.rgb(18, 79, 45) }
        val cardBg = Paint().apply { color = Color.rgb(244, 248, 245) }
        val dividerPaint = Paint().apply {
            color = Color.rgb(212, 227, 217)
            strokeWidth = 1f
        }
        val titlePaint = Paint().apply {
            color = Color.WHITE
            textSize = 20f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        val subtitlePaint = Paint().apply {
            color = Color.rgb(216, 243, 224)
            textSize = 11f
            isAntiAlias = true
        }
        val sectionPaint = Paint().apply {
            color = Color.rgb(18, 79, 45)
            textSize = 13f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        val bodyPaint = Paint().apply {
            color = Color.rgb(32, 42, 36)
            textSize = 10.5f
            isAntiAlias = true
        }
        val mutedPaint = Paint().apply {
            color = Color.rgb(95, 110, 100)
            textSize = 9.5f
            isAntiAlias = true
        }

        // Top Emerald Header Banner
        canvas.drawRect(0f, 0f, 595f, 88f, headerBg)
        canvas.drawText("GURU JI VISION — OWNER MONITORING REPORT", 32f, 40f, titlePaint)
        canvas.drawText(
            "Period: ${snapshot.timeframe.label}  |  Generated: ${snapshot.generatedAtLabel}",
            32f,
            62f,
            subtitlePaint
        )
        canvas.drawText(
            "Privacy Notice: Student private Money Manager records are strictly excluded.",
            32f,
            78f,
            subtitlePaint
        )

        var y = 114f
        fun drawSection(heading: String, rows: List<Pair<String, String>>) {
            canvas.drawText(heading, 32f, y, sectionPaint)
            y += 8f
            canvas.drawLine(32f, y, 563f, y, dividerPaint)
            y += 14f
            rows.forEach { (k, v) ->
                canvas.drawText(k, 38f, y, bodyPaint)
                canvas.drawText(v, 360f, y, bodyPaint)
                y += 16f
            }
            y += 10f
        }

        drawSection(
            "1. User Registrations & Engagement",
            listOf(
                "Total Registered Users" to "${snapshot.totalUsers} (Students: ${snapshot.studentCount}, Farmers: ${snapshot.farmerCount})",
                "New Registrations (${snapshot.timeframe.label})" to "${snapshot.newRegistrationsInPeriod}",
                "Active (7d) vs Inactive Users" to "${snapshot.activeUsers7d} Active / ${snapshot.inactiveUsers} Inactive",
                "Logged Activity Events" to "${snapshot.activityEventsInPeriod} (Student: ${snapshot.studentEventsInPeriod}, Farmer: ${snapshot.farmerEventsInPeriod})"
            )
        )

        drawSection(
            "2. Academics, Examinations & Farmer Support Desk",
            listOf(
                "Study Materials Published" to "${snapshot.totalStudyMaterials} (+${snapshot.materialsAddedInPeriod} in period)",
                "MCQ Bank & Exam Attempts" to "${snapshot.totalQuizQuestions} MCQs | ${snapshot.examAttemptsInPeriod} Attempts",
                "Exam Performance" to "Avg ${snapshot.avgExamScorePct.roundToInt()}% | Pass Rate ${snapshot.examPassRatePct.roundToInt()}%",
                "Farmer Support Queries" to "${snapshot.totalFarmerQueries} Total (${snapshot.openQueries} Open, ${snapshot.inReviewQueries} Review, ${snapshot.resolvedQueries} Resolved)"
            )
        )

        drawSection(
            "3. Gemini AI Usage & Estimated Cost",
            listOf(
                "Gemini Requests (${snapshot.timeframe.label})" to "${snapshot.aiRequestsInPeriod} (${snapshot.aiSuccessCount} succeeded)",
                "Token Consumption (Input / Output)" to "${snapshot.aiPromptTokens} / ${snapshot.aiOutputTokens} tokens",
                "Average Response Latency" to "${snapshot.aiAvgLatencyMs} ms",
                "Estimated API Cost (USD / INR)" to String.format(
                    Locale.ENGLISH,
                    "$%.5f  (INR %.3f)",
                    snapshot.estimatedAiCostUsd,
                    snapshot.estimatedAiCostInr
                )
            )
        )

        drawSection(
            "4. Firebase Firestore Footprint & System Health",
            listOf(
                "Monitored Firestore Documents" to "${snapshot.totalFirestoreDocuments} docs",
                "Estimated Serialized Payload" to "${formatByteSize(snapshot.estimatedFirestoreBytes)} (Free Tier: 1 GiB)",
                "Error Logs / Unresolved Alerts" to "${snapshot.totalErrorsInPeriod} logs | ${snapshot.unresolvedCriticalOrWarningCount} open alerts",
                "Pending Content Reports" to "${snapshot.pendingContentReports} pending | ${snapshot.hiddenCommunityPosts} posts hidden"
            )
        )

        // Collection breakdown mini box
        canvas.drawRoundRect(32f, y, 563f, (y + 135f).coerceAtMost(810f), 8f, 8f, cardBg)
        y += 18f
        canvas.drawText("Collection Footprint Summary (Real Connected Data)", 44f, y, sectionPaint)
        y += 16f
        snapshot.collectionFootprints.take(6).forEach { fp ->
            canvas.drawText("• ${fp.collectionName}: ${fp.documentCount} docs (${formatByteSize(fp.estimatedBytes)})", 44f, y, mutedPaint)
            y += 14f
        }

        pdf.finishPage(page)

        val stream = context.contentResolver.openOutputStream(uri)
            ?: return Result.failure(IllegalStateException("Unable to open destination PDF file."))
        stream.use { out ->
            pdf.writeTo(out)
        }
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    } finally {
        pdf.close()
    }
}
