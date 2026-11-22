package com.example.data.repository

import com.example.core.OperationType
import com.example.core.handleFirestoreError
import com.example.data.model.Announcement
import com.example.data.model.AppSettings
import com.example.data.model.CareerOpportunity
import com.example.data.model.CommunityPost
import com.example.data.model.QuizAttempt
import com.example.data.model.QuizQuestion
import com.example.data.model.StudyMaterial
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

class AcademicRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google.")

    // --- STUDY MATERIALS ---
    fun observeStudyMaterials(includeUnpublishedForAdmin: Boolean = false): Flow<List<StudyMaterial>> = flow {
        val uid = requireUserId()
        val path = "studyMaterials"
        val query = if (includeUnpublishedForAdmin) {
            db.collection(path).limit(200)
        } else {
            db.collection(path).whereEqualTo("published", true).limit(200)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        StudyMaterial::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedBy { it.semester }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun addStudyMaterial(
        title: String,
        semester: Long,
        subject: String,
        category: String,
        summary: String,
        resourceUrl: String,
        contentText: String = "",
        verifiedForAi: Boolean = true
    ): Result<Unit> {
        var path = "studyMaterials"
        return try {
            val uid = requireUserId()
            require(title.trim().length in 2..150) { "Title must be 2–150 characters." }
            require(subject.trim().length in 2..80) { "Subject must be 2–80 characters." }
            require(summary.trim().length in 5..1000) { "Summary must be at least 5 characters." }
            val docRef = db.collection("studyMaterials").document()
            path = docRef.path
            val payload = mutableMapOf<String, Any>(
                "title" to title.trim().take(150),
                "semester" to semester.coerceIn(1L, 8L),
                "subject" to subject.trim().take(80),
                "category" to category,
                "summary" to summary.trim().take(1000),
                "verifiedForAi" to verifiedForAi,
                "resourceUrl" to resourceUrl.trim().take(400),
                "published" to true,
                "createdBy" to uid,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            val cleanContent = contentText.trim().take(12_000)
            if (cleanContent.isNotEmpty()) {
                payload["contentText"] = cleanContent
            }
            docRef.set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteStudyMaterial(materialId: String): Result<Unit> {
        val path = "studyMaterials/$materialId"
        return try {
            requireUserId()
            db.collection("studyMaterials").document(materialId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    // --- QUIZZES & ATTEMPTS ---
    fun observeQuizzes(includeUnpublishedForAdmin: Boolean = false): Flow<List<QuizQuestion>> = flow {
        val uid = requireUserId()
        val path = "quizzes"
        val query = if (includeUnpublishedForAdmin) {
            db.collection(path).limit(250)
        } else {
            db.collection(path).whereEqualTo("published", true).limit(250)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        QuizQuestion::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedBy { it.semester }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    fun observeMyQuizAttempts(userId: String): Flow<List<QuizAttempt>> = flow {
        val uid = requireUserId()
        check(uid == userId)
        val path = "users/$uid/quizAttempts"
        emitAll(
            db.collection("users").document(uid).collection("quizAttempts")
                .limit(100)
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        QuizAttempt::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun addQuizQuestion(
        title: String,
        semester: Long,
        subject: String,
        questionText: String,
        options: List<String>,
        correctIndex: Long,
        explanation: String
    ): Result<Unit> {
        var path = "quizzes"
        return try {
            val uid = requireUserId()
            require(options.size == 4 && options.all { it.trim().isNotEmpty() }) {
                "All 4 MCQ options are required."
            }
            val docRef = db.collection("quizzes").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "title" to title.trim().take(120),
                    "semester" to semester.coerceIn(1L, 8L),
                    "subject" to subject.trim().take(80),
                    "questionText" to questionText.trim().take(500),
                    "options" to options.map { it.trim().take(160) },
                    "correctIndex" to correctIndex.coerceIn(0L, 3L),
                    "explanation" to explanation.trim().take(500),
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun recordQuizAttempt(semester: Long, score: Long, totalQuestions: Long): Result<Unit> {
        var path = "users/unknown/quizAttempts"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid).collection("quizAttempts").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "semester" to semester.coerceIn(1L, 8L),
                    "score" to score.coerceIn(0L, totalQuestions),
                    "totalQuestions" to totalQuestions.coerceAtLeast(1L),
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteQuizQuestion(quizId: String): Result<Unit> {
        val path = "quizzes/$quizId"
        return try {
            requireUserId()
            db.collection("quizzes").document(quizId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    // --- CAREERS ---
    fun observeCareers(includeUnpublishedForAdmin: Boolean = false): Flow<List<CareerOpportunity>> = flow {
        val uid = requireUserId()
        val path = "careerOpportunities"
        val query = if (includeUnpublishedForAdmin) {
            db.collection(path).limit(150)
        } else {
            db.collection(path).whereEqualTo("published", true).limit(150)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        CareerOpportunity::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun addCareer(
        title: String,
        organization: String,
        category: String,
        eligibility: String,
        deadline: String,
        description: String,
        applyUrl: String
    ): Result<Unit> {
        var path = "careerOpportunities"
        return try {
            val uid = requireUserId()
            require(title.trim().length in 2..150) { "Career title is required." }
            require(organization.trim().length in 2..120) { "Organization is required." }
            val docRef = db.collection("careerOpportunities").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "title" to title.trim().take(150),
                    "organization" to organization.trim().take(120),
                    "category" to category,
                    "eligibility" to eligibility.trim().ifBlank { "B.Sc Agriculture" }.take(200),
                    "deadline" to deadline.trim().ifBlank { "Open" }.take(40),
                    "description" to description.trim().ifBlank { "See official notification." }.take(1000),
                    "applyUrl" to applyUrl.trim().take(400),
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteCareer(careerId: String): Result<Unit> {
        val path = "careerOpportunities/$careerId"
        return try {
            requireUserId()
            db.collection("careerOpportunities").document(careerId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    // --- COMMUNITY POSTS ---
    fun observeCommunityPosts(includeHiddenForAdmin: Boolean = false): Flow<List<CommunityPost>> = flow {
        val uid = requireUserId()
        val path = "communityPosts"
        val query = if (includeHiddenForAdmin) {
            db.collection(path).limit(200)
        } else {
            db.collection(path).whereEqualTo("status", "ACTIVE").limit(200)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        CommunityPost::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun createCommunityPost(
        authorName: String,
        collegeGroup: String,
        topic: String,
        title: String,
        body: String
    ): Result<Unit> {
        var path = "communityPosts"
        return try {
            val uid = requireUserId()
            require(title.trim().length in 3..140) { "Post title must be 3–140 characters." }
            require(body.trim().length in 5..1500) { "Post details must be at least 5 characters." }
            val docRef = db.collection("communityPosts").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "authorId" to uid,
                    "authorName" to authorName.trim().ifBlank { "Student" }.take(80),
                    "collegeGroup" to collegeGroup.trim().ifBlank { "All India Agri" }.take(100),
                    "topic" to topic,
                    "title" to title.trim().take(140),
                    "body" to body.trim().take(1500),
                    "helpfulCount" to 0L,
                    "status" to "ACTIVE",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun upvoteCommunityPost(postId: String): Result<Unit> {
        val path = "communityPosts/$postId"
        return try {
            requireUserId()
            db.collection("communityPosts").document(postId).update(
                mapOf(
                    "helpfulCount" to FieldValue.increment(1L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun moderateCommunityPost(postId: String, newStatus: String): Result<Unit> {
        val path = "communityPosts/$postId"
        return try {
            requireUserId()
            val safe = if (newStatus == "HIDDEN") "HIDDEN" else "ACTIVE"
            db.collection("communityPosts").document(postId).update(
                mapOf(
                    "status" to safe,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    // --- ANNOUNCEMENTS ---
    fun observeAnnouncements(includeInactiveForAdmin: Boolean = false): Flow<List<Announcement>> = flow {
        val uid = requireUserId()
        val path = "announcements"
        val query = if (includeInactiveForAdmin) {
            db.collection(path).limit(100)
        } else {
            db.collection(path).whereEqualTo("active", true).limit(100)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(
                        Announcement::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun addAnnouncement(title: String, message: String, audience: String): Result<Unit> {
        var path = "announcements"
        return try {
            val uid = requireUserId()
            require(title.trim().length in 2..120) { "Announcement title is required." }
            require(message.trim().length in 3..500) { "Announcement message is required." }
            val docRef = db.collection("announcements").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "title" to title.trim().take(120),
                    "message" to message.trim().take(500),
                    "audience" to audience,
                    "active" to true,
                    "createdBy" to uid,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteAnnouncement(id: String): Result<Unit> {
        val path = "announcements/$id"
        return try {
            requireUserId()
            db.collection("announcements").document(id).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    // --- GLOBAL APP SETTINGS ---
    fun observeAppSettings(): Flow<AppSettings> = flow {
        val uid = requireUserId()
        val path = "appSettings/global"
        emitAll(
            db.collection("appSettings").document("global")
                .snapshots()
                .map { snap ->
                    if (snap.exists()) {
                        snap.toObject(
                            AppSettings::class.java,
                            DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                        ) ?: AppSettings()
                    } else {
                        AppSettings()
                    }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.GET, path)
                    }
                    emit(AppSettings())
                }
        )
    }

    suspend fun saveAppSettings(
        whatsappNumber: String,
        supportEmail: String,
        aboutText: String,
        heroHeadline: String,
        currentSettings: AppSettings = AppSettings()
    ): Result<Unit> {
        return saveFullAppSettings(
            currentSettings.copy(
                whatsappNumber = whatsappNumber,
                supportEmail = supportEmail,
                aboutText = aboutText,
                heroHeadline = heroHeadline
            )
        )
    }

    suspend fun saveFullAppSettings(settings: AppSettings): Result<Unit> {
        val path = "appSettings/global"
        return try {
            requireUserId()
            require(settings.whatsappNumber.trim().length in 5..25) { "Valid WhatsApp number required." }
            val officialGroupUrl = settings.whatsappGroupInviteUrl.trim()
                .ifBlank { "https://chat.whatsapp.com/FUtzkunI4u097tdsa1dIxl?s=cl&p=a&iam=2" }
                .take(300)
            db.collection("appSettings").document("global").set(
                mapOf(
                    "whatsappNumber" to settings.whatsappNumber.trim().take(25),
                    "whatsappGroupInviteUrl" to officialGroupUrl,
                    "supportEmail" to settings.supportEmail.trim().ifBlank { "mondalsayan9932@gmail.com" }.take(120),
                    "aboutText" to settings.aboutText.trim().ifBlank { "Guru Ji Vision Agriculture & Education Ecosystem." }.take(1000),
                    "heroHeadline" to settings.heroHeadline.trim().ifBlank { "Empowering Indian Agriculture & B.Sc Agri Scholars" }.take(140),
                    "studentModuleEnabled" to settings.studentModuleEnabled,
                    "moneyManagerEnabled" to settings.moneyManagerEnabled,
                    "farmerModuleEnabled" to settings.farmerModuleEnabled,
                    "toolsModuleEnabled" to settings.toolsModuleEnabled,
                    "aiAssistantEnabled" to settings.aiAssistantEnabled,
                    "careerModuleEnabled" to settings.careerModuleEnabled,
                    "communityModuleEnabled" to settings.communityModuleEnabled,
                    "meetingZoneEnabled" to settings.meetingZoneEnabled,
                    "doubtZoneEnabled" to settings.doubtZoneEnabled,
                    "aiModelName" to AgriAiRepository.sanitizeFreeModelName(settings.aiModelName),
                    "aiFreeSearchEnabled" to settings.aiFreeSearchEnabled,
                    "aiDailyLimitPerUser" to settings.aiDailyLimitPerUser.coerceIn(1L, 200L),
                    "aiPaidServicesApproved" to settings.aiPaidServicesApproved,
                    "maintenanceBanner" to settings.maintenanceBanner.trim().take(300),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    /**
     * Admin-triggered action to publish an authentic ICAR B.Sc Agriculture starter curriculum,
     * MCQ set, career alerts, and default app settings directly into Firestore.
     */
    suspend fun publishStarterCurriculumAsAdmin(): Result<Unit> {
        return try {
            val uid = requireUserId()
            val batch = db.batch()
            val now = FieldValue.serverTimestamp()

            val starterMaterials = listOf(
                mapOf(
                    "title" to "Fundamentals of Agronomy & Crop Geometry (ICAR 5th Deans)",
                    "semester" to 1L,
                    "subject" to "Agronomy",
                    "category" to "NOTES_PDF",
                    "summary" to "Covers tillage concepts, soil tilth, seed germination, cropping systems, and nutrient management principles for Sem 1.",
                    "contentText" to "Agronomy Fundamentals (ICAR 5th Deans): Tillage is the physical manipulation of soil to create favourable tilth for seed germination and root growth. Primary tillage opens compact soil (mouldboard plough, disc plough); secondary tillage refines the seedbed (harrowing, planking). Zero tillage conserves soil moisture and organic matter. Crop geometry (row x plant spacing) optimizes light interception and yield. Wheat Crown Root Initiation (CRI) occurs at 20–25 days after sowing (DAS) and is the most critical irrigation stage.",
                    "verifiedForAi" to true,
                    "resourceUrl" to "https://icar.org.in",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                ),
                mapOf(
                    "title" to "Fundamentals of Soil Science: pH, CEC & Clay Minerals",
                    "semester" to 1L,
                    "subject" to "Soil Science",
                    "category" to "PRACTICAL",
                    "summary" to "Lab manual on soil sampling, pH meter calibration, electrical conductivity (EC), and organic carbon estimation (Walkley-Black).",
                    "contentText" to "Soil Science Key Concepts: Soil pH measures H+ ion activity (acidic <6.5, neutral 6.5–7.5, alkaline >7.5). Acid soils are reclaimed with Agricultural Lime (CaCO3); sodic/alkali soils are reclaimed with Gypsum (CaSO4·2H2O) because Ca2+ displaces exchangeable Na+. Cation Exchange Capacity (CEC) is measured in cmol(+)/kg: Humus (150–300) > Vermiculite (100–150) > Montmorillonite (80–150) > Illite (15–40) > Kaolinite (3–15). Urea contains 46% N; DAP contains 18% N and 46% P2O5; MOP contains 60% K2O.",
                    "verifiedForAi" to true,
                    "resourceUrl" to "https://icar.org.in",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                ),
                mapOf(
                    "title" to "Plant Pathology: Rice Blast & Late Blight Disease Cycles",
                    "semester" to 3L,
                    "subject" to "Plant Pathology",
                    "category" to "VIDEO_LECTURE",
                    "summary" to "Detailed diagnostic signs, fungal spore morphology, and integrated disease management protocols for Indian field crops.",
                    "contentText" to "Plant Pathology Notes: Rice Blast is caused by Magnaporthe oryzae (Pyricularia oryzae), producing characteristic spindle/diamond-shaped lesions with grey centres and dark brown margins on leaves, plus neck blast at panicle base. Management includes resistant varieties, avoiding excess nitrogen, seed treatment, and KVK-recommended fungicides. Late Blight of Potato is caused by the oomycete Phytophthora infestans, favoured by cool (10–20°C) humid/foggy weather, producing water-soaked dark blotches with white cottony mycelial growth on the underside of leaves.",
                    "verifiedForAi" to true,
                    "resourceUrl" to "https://icar.org.in",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                ),
                mapOf(
                    "title" to "ICAR AIEEA PG & IBPS AFO Previous Year Solved Paper Set",
                    "semester" to 6L,
                    "subject" to "Competitive Exam Prep",
                    "category" to "PYQ",
                    "summary" to "Topic-wise solved questions across Agronomy, Entomology, Agricultural Economics, and Extension Education.",
                    "resourceUrl" to "https://icar.org.in",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                )
            )
            starterMaterials.forEachIndexed { idx, data ->
                batch.set(db.collection("studyMaterials").document("starter_mat_${idx + 1}"), data)
            }

            val starterQuizzes = listOf(
                mapOf(
                    "title" to "Agronomy Core Check #1",
                    "semester" to 1L,
                    "subject" to "Agronomy",
                    "questionText" to "What is the nitrogen (N) percentage present in commercial Urea fertilizer?",
                    "options" to listOf("18% N", "46% N", "60% N", "25% N"),
                    "correctIndex" to 1L,
                    "explanation" to "Commercial agricultural Urea [CO(NH2)2] contains 46% Nitrogen by weight.",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                ),
                mapOf(
                    "title" to "Soil Science Check #2",
                    "semester" to 1L,
                    "subject" to "Soil Science",
                    "questionText" to "Which soil amendment is commonly recommended to reclaim alkali (sodic) soils?",
                    "options" to listOf("Agricultural Lime", "Gypsum (CaSO4·2H2O)", "Rock Phosphate", "Muriate of Potash"),
                    "correctIndex" to 1L,
                    "explanation" to "Gypsum supplies soluble calcium that replaces exchangeable sodium on clay colloids.",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                ),
                mapOf(
                    "title" to "Crop Physiology Check #3",
                    "semester" to 3L,
                    "subject" to "Agronomy",
                    "questionText" to "At which critical growth stage does Wheat require its most vital first irrigation (around 21 DAS)?",
                    "options" to listOf("Dough stage", "Crown Root Initiation (CRI)", "Flowering stage", "Milk stage"),
                    "correctIndex" to 1L,
                    "explanation" to "Crown Root Initiation (CRI) at 20–25 DAS is the most moisture-sensitive stage in dwarf wheat.",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                )
            )
            starterQuizzes.forEachIndexed { idx, data ->
                batch.set(db.collection("quizzes").document("starter_quiz_${idx + 1}"), data)
            }

            val starterCareers = listOf(
                mapOf(
                    "title" to "IBPS Specialist Officer — Agriculture Field Officer (AFO)",
                    "organization" to "IBPS / Public Sector Banks",
                    "category" to "GOVT_JOB",
                    "eligibility" to "4-Year B.Sc (Hons.) Agriculture / Horticulture / Fishery",
                    "deadline" to "Annual Cycle",
                    "description" to "Scale-I officer recruitment across Indian public sector banks focusing on rural credit, KCC, and agri-project appraisal.",
                    "applyUrl" to "https://www.ibps.in",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                ),
                mapOf(
                    "title" to "ICAR AIEEA (PG) & JRF Fellowship",
                    "organization" to "ICAR / NTA",
                    "category" to "SCHOLARSHIP",
                    "eligibility" to "Final-year or Graduate B.Sc Agriculture students",
                    "deadline" to "Annual Cycle",
                    "description" to "National entrance exam for M.Sc Agriculture admissions and ICAR Junior Research Fellowship stipend.",
                    "applyUrl" to "https://icar.nta.nic.in",
                    "published" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                )
            )
            starterCareers.forEachIndexed { idx, data ->
                batch.set(db.collection("careerOpportunities").document("starter_career_${idx + 1}"), data)
            }

            batch.set(
                db.collection("announcements").document("starter_welcome_notice"),
                mapOf(
                    "title" to "Welcome to Guru Ji Vision Ecosystem",
                    "message" to "Explore semester-wise B.Sc Agriculture materials, private INR Money Manager, NPK calculators, and Gemini AI crop guidance.",
                    "audience" to "ALL",
                    "active" to true,
                    "createdBy" to uid,
                    "createdAt" to now,
                    "updatedAt" to now
                )
            )

            batch.set(
                db.collection("appSettings").document("global"),
                mapOf(
                    "whatsappNumber" to "+919000000000",
                    "whatsappGroupInviteUrl" to "https://chat.whatsapp.com/FUtzkunI4u097tdsa1dIxl?s=cl&p=a&iam=2",
                    "supportEmail" to "mondalsayan9932@gmail.com",
                    "aboutText" to "Guru Ji Vision is a unified Indian Agriculture & Education Ecosystem connecting B.Sc Agriculture students, farmers, and agronomists with bilingual English & Bengali guidance.",
                    "heroHeadline" to "Empowering Indian Agriculture & B.Sc Agri Scholars",
                    "updatedAt" to now
                )
            )

            batch.commit().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "starter_curriculum_batch")
            Result.failure(e)
        }
    }
}
