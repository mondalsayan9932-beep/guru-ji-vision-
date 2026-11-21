package com.example.data.model

import androidx.annotation.Keep
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

@Keep
@IgnoreExtraProperties
data class UserProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val email: String = "",
    val role: String = "STUDENT", // STUDENT or FARMER
    val institutionOrVillage: String = "",
    val district: String = "",
    val semester: Long = 1L,
    val language: String = "EN", // EN or BN
    val photoUrl: String = "",
    val lastActiveAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class MoneyTransaction(
    @DocumentId val id: String = "",
    val title: String = "",
    val amount: Double = 0.0,
    val type: String = "EXPENSE", // INCOME or EXPENSE
    val category: String = "FOOD_MESS", // FOOD_MESS, HOSTEL_RENT, EDUCATION, TRAVEL_RECHARGE, SHARED, SAVINGS, ALLOWANCE, SCHOLARSHIP, OTHER
    val note: String = "",
    val dateLabel: String = "",
    val sharedWith: String? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class FinancialGoal(
    @DocumentId val id: String = "",
    val name: String = "",
    val kind: String = "MONTHLY_BUDGET", // MONTHLY_BUDGET or SAVINGS_GOAL
    val targetAmount: Double = 0.0,
    val savedAmount: Double = 0.0,
    val monthKey: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class QuizAttempt(
    @DocumentId val id: String = "",
    val semester: Long = 1L,
    val score: Long = 0L,
    val totalQuestions: Long = 1L,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class FarmerQuery(
    @DocumentId val id: String = "",
    val userId: String = "",
    val farmerName: String = "",
    val cropName: String = "",
    val category: String = "DISEASE", // DISEASE, PEST, FERTILIZER, SOIL, WEATHER, OTHER
    val description: String = "",
    val district: String = "",
    val hasImage: Boolean = false,
    val imageSummary: String = "",
    val status: String = "OPEN", // OPEN, IN_REVIEW, RESOLVED
    val adminReply: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class StudyMaterial(
    @DocumentId val id: String = "",
    val title: String = "",
    val semester: Long = 1L,
    val subject: String = "",
    val category: String = "NOTES_PDF", // NOTES_PDF, VIDEO_LECTURE, PYQ, PRACTICAL
    val summary: String = "",
    val contentText: String = "", // Extracted educational PDF / notes text for AI Guru Knowledge Base
    val verifiedForAi: Boolean = true,
    val resourceUrl: String = "",
    val published: Boolean = true,
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class QuizQuestion(
    @DocumentId val id: String = "",
    val title: String = "",
    val semester: Long = 1L,
    val subject: String = "",
    val questionText: String = "",
    val options: List<String> = emptyList(),
    val correctIndex: Long = 0L,
    val explanation: String = "",
    val published: Boolean = true,
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class CareerOpportunity(
    @DocumentId val id: String = "",
    val title: String = "",
    val organization: String = "",
    val category: String = "GOVT_JOB", // GOVT_JOB, PRIVATE_JOB, SCHOLARSHIP, INTERNSHIP, COMPETITIVE_EXAM
    val eligibility: String = "",
    val deadline: String = "",
    val description: String = "",
    val applyUrl: String = "",
    val published: Boolean = true,
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class CommunityPost(
    @DocumentId val id: String = "",
    val authorId: String = "",
    val authorName: String = "",
    val collegeGroup: String = "",
    val topic: String = "DOUBT", // DOUBT, NOTES_SHARE, EXAM_PREP, FARM_TALK
    val title: String = "",
    val body: String = "",
    val helpfulCount: Long = 0L,
    val status: String = "ACTIVE", // ACTIVE or HIDDEN
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class Announcement(
    @DocumentId val id: String = "",
    val title: String = "",
    val message: String = "",
    val audience: String = "ALL", // ALL, STUDENTS, FARMERS
    val active: Boolean = true,
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class AppSettings(
    @DocumentId val id: String = "",
    val whatsappNumber: String = "+919000000000",
    val whatsappGroupInviteUrl: String = "https://chat.whatsapp.com/FUtzkunI4u097tdsa1dIxl?s=cl&p=a&iam=2",
    val supportEmail: String = "mondalsayan9932@gmail.com",
    val aboutText: String = "Guru Ji Vision is an Indian Agriculture & Education Ecosystem supporting B.Sc Agriculture students, farmers, and educators.",
    val heroHeadline: String = "Empowering Indian Agriculture & B.Sc Agri Scholars",
    val studentModuleEnabled: Boolean = true,
    val moneyManagerEnabled: Boolean = true,
    val farmerModuleEnabled: Boolean = true,
    val toolsModuleEnabled: Boolean = true,
    val aiAssistantEnabled: Boolean = true,
    val careerModuleEnabled: Boolean = true,
    val communityModuleEnabled: Boolean = true,
    val meetingZoneEnabled: Boolean = true,
    val doubtZoneEnabled: Boolean = true,
    val aiModelName: String = "gemini-3.8-flash", // Free-tier only: gemini-3.8-flash or gemini-3.5-flash-lite
    val aiFreeSearchEnabled: Boolean = true, // Free Wikimedia/Wikipedia open search with source links
    val aiDailyLimitPerUser: Long = 25L, // Daily per-user question limit to protect free quota
    val aiPaidServicesApproved: Boolean = false, // Never auto-enable paid AI services
    val maintenanceBanner: String = "",
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class AdminRecord(
    @DocumentId val id: String = "",
    val email: String = "",
    val roleTitle: String = "Admin",
    val addedBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ActivityEvent(
    @DocumentId val id: String = "",
    val userId: String = "",
    val userRole: String = "STUDENT", // STUDENT, FARMER, ADMIN
    val eventType: String = "APP_SESSION", // APP_SESSION, STUDY_VIEW, EXAM_COMPLETED, QUERY_SUBMITTED, POST_CREATED, TOOL_USED, MATERIAL_UPLOADED
    val module: String = "STUDENT", // STUDENT, FARMER, TOOLS, AI, COMMUNITY, CAREER, ADMIN
    val detail: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ExamStat(
    @DocumentId val id: String = "",
    val userId: String = "",
    val semester: Long = 1L,
    val score: Long = 0L,
    val totalQuestions: Long = 1L,
    val percentage: Long = 0L,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class AiUsageLog(
    @DocumentId val id: String = "",
    val userId: String = "",
    val modelName: String = "gemini-3.8-flash",
    val feature: String = "AI_CHAT", // AI_CHAT, CROP_PHOTO_SCAN
    val language: String = "EN", // EN, BN
    val promptTokens: Long = 0L,
    val outputTokens: Long = 0L,
    val latencyMs: Long = 0L,
    val success: Boolean = true,
    val hasImage: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ErrorLog(
    @DocumentId val id: String = "",
    val userId: String = "",
    val source: String = "SYSTEM", // FIRESTORE, AI_LOGIC, AUTH, SYSTEM
    val severity: String = "WARNING", // INFO, WARNING, CRITICAL
    val module: String = "",
    val message: String = "",
    val resolved: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ContentReport(
    @DocumentId val id: String = "",
    val reporterId: String = "",
    val reporterName: String = "",
    val targetType: String = "COMMUNITY_POST",
    val targetId: String = "",
    val targetTitle: String = "",
    val reason: String = "",
    val status: String = "PENDING", // PENDING, DISMISSED, ACTION_TAKEN
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class AdminAuditLog(
    @DocumentId val id: String = "",
    val actorUid: String = "",
    val actorEmail: String = "",
    val action: String = "",
    val targetType: String = "",
    val targetId: String = "",
    val summary: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class MeetingSession(
    @DocumentId val id: String = "",
    val title: String = "",
    val subject: String = "",
    val description: String = "",
    val meetUrl: String = "",
    val scheduledDate: String = "",
    val scheduledTime: String = "",
    val scheduledAtEpochMs: Long = 0L,
    val hostName: String = "",
    val hostUid: String = "",
    val notifyStudents: Boolean = true,
    val published: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ProfessorProfile(
    @DocumentId val id: String = "",
    val name: String = "",
    val designation: String = "",
    val qualification: String = "",
    val subject: String = "",
    val department: String = "",
    val email: String = "",
    val specialization: String = "",
    val avatarUrl: String = "",
    val authorizedUid: String = "",
    val canHostMeetings: Boolean = true,
    val active: Boolean = true,
    val displayOrder: Long = 0L,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ProfessorAccountLink(
    @DocumentId val id: String = "",
    val professorId: String = "",
    val email: String = "",
    val canHostMeetings: Boolean = true,
    val active: Boolean = true,
    val addedBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class DoubtChatThread(
    @DocumentId val id: String = "",
    val studentId: String = "",
    val studentName: String = "",
    val studentSemester: Long = 1L,
    val professorId: String = "",
    val professorName: String = "",
    val professorEmail: String = "",
    val professorUid: String = "",
    val lastMessagePreview: String = "",
    val lastSenderRole: String = "STUDENT", // STUDENT or PROFESSOR
    val unreadForStudent: Long = 0L,
    val unreadForProfessor: Long = 0L,
    val studentLastReadAt: Timestamp? = null,
    val professorLastReadAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class DoubtMessage(
    @DocumentId val id: String = "",
    val studentId: String = "",
    val professorId: String = "",
    val professorEmail: String = "",
    val professorUid: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderRole: String = "STUDENT", // STUDENT or PROFESSOR
    val text: String = "",
    val hasImage: Boolean = false,
    val imageBase64: String? = null,
    val readByRecipient: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null
)
