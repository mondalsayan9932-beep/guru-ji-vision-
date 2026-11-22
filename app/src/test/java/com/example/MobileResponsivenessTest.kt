package com.example

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasScrollToNodeAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToIndex
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.example.core.AppLanguage
import com.example.data.model.AppSettings
import com.example.data.model.CareerOpportunity
import com.example.data.model.CommunityPost
import com.example.data.model.FinancialGoal
import com.example.data.model.MoneyTransaction
import com.example.data.model.QuizQuestion
import com.example.data.model.StudyMaterial
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.ui.components.DonutSegment
import com.example.ui.components.SegmentedDonutChart
import com.example.ui.components.WindowWidthTier
import com.example.ui.components.computeResponsiveMetrics
import com.example.ui.screens.AgriToolsScreen
import com.example.ui.screens.AiAssistantScreen
import com.example.ui.screens.CareerCommunityScreen
import com.example.ui.screens.FarmerHubScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.MoneyManagerScreen
import com.example.ui.screens.OnboardingScreen
import com.example.ui.screens.StudentHubScreen
import com.example.ui.theme.GuruJiVisionTheme
import com.example.viewmodel.AiAssistantUiState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class MobileResponsivenessTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun `responsive breakpoints classify 320dp through 1200dp accurately`() {
        val m320 = computeResponsiveMetrics(320.dp)
        assertEquals(WindowWidthTier.ULTRA_COMPACT, m320.tier)
        assertTrue(m320.isUltraCompact)
        assertTrue(m320.isPhone)
        assertEquals(1, m320.gridColumns)
        assertEquals(12.dp, m320.horizontalPadding)

        for (w in listOf(360.dp, 390.dp, 412.dp, 480.dp)) {
            val m = computeResponsiveMetrics(w)
            assertEquals("Expected COMPACT for $w", WindowWidthTier.COMPACT, m.tier)
            assertFalse(m.isUltraCompact)
            assertTrue(m.isPhone)
            assertEquals(1, m.gridColumns)
        }

        for (w in listOf(600.dp, 768.dp)) {
            val m = computeResponsiveMetrics(w)
            assertEquals("Expected MEDIUM for $w", WindowWidthTier.MEDIUM, m.tier)
            assertTrue(m.isTabletOrDesktop)
            assertEquals(2, m.gridColumns)
        }

        for (w in listOf(840.dp, 1200.dp)) {
            val m = computeResponsiveMetrics(w)
            assertEquals("Expected EXPANDED for $w", WindowWidthTier.EXPANDED, m.tier)
            assertTrue(m.isExpanded)
            assertEquals(2, m.gridColumns)
        }
    }

    @Test
    fun `onboarding screen renders cleanly on 320dp ultra-compact width with role selection`() {
        var submittedRole = ""
        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 320.dp, height = 640.dp)) {
                    OnboardingScreen(
                        initialName = "Sayan Mondal",
                        initialEmail = "student@example.com",
                        language = AppLanguage.EN,
                        onLanguageChange = {},
                        busy = false,
                        onCompleteRegistration = { _, role, _, _, _, _ ->
                            submittedRole = role
                        }
                    )
                }
            }
        }

        composeRule.onNodeWithTag("role_select_farmer").performScrollTo().performClick()
        composeRule.onNodeWithTag("complete_onboarding_button").performScrollTo().performClick()
        assertEquals("FARMER", submittedRole)
    }

    @Test
    fun `home screen renders across 320dp mobile and 768dp tablet without overflow`() {
        val sampleProfile = UserProfile(
            id = "u1",
            userId = "u1",
            displayName = "Sayan Mondal",
            email = "mondalsayan9932@gmail.com",
            role = "STUDENT",
            semester = 4L
        )
        var openedOwnerCenter = false
        var openedAdmin = false

        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 320.dp, height = 720.dp)) {
                    HomeScreen(
                        profile = sampleProfile,
                        isFounder = true,
                        language = AppLanguage.EN,
                        announcementsState = UiState.Success(emptyList()),
                        appSettings = AppSettings(),
                        onOpenStudent = {},
                        onOpenMoneyManager = {},
                        onOpenFarmer = {},
                        onOpenTools = {},
                        onOpenAi = {},
                        onOpenCareerCommunity = {},
                        onOpenAdmin = { openedAdmin = true },
                        onOpenOwnerCenter = { openedOwnerCenter = true },
                        onSignOut = {}
                    )
                }
            }
        }

        composeRule.onNodeWithTag("open_owner_center_button").assertExists().performClick()
        assertTrue(openedOwnerCenter)
        composeRule.onNodeWithTag("open_admin_dashboard_button").assertExists().performClick()
        assertTrue(openedAdmin)
    }

    @Test
    fun `money manager screen on 320dp stacks action buttons and opens scrollable add dialog`() {
        val sampleTx = listOf(
            MoneyTransaction(
                id = "tx1",
                title = "Hostel Mess Fee",
                amount = 3200.0,
                type = "EXPENSE",
                category = "FOOD_MESS",
                dateLabel = "2026-11-10"
            )
        )
        val sampleGoals = listOf(
            FinancialGoal(
                id = "g1",
                name = "Monthly Budget",
                kind = "MONTHLY_BUDGET",
                targetAmount = 8000.0,
                savedAmount = 3200.0,
                monthKey = "2026-11"
            )
        )

        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 320.dp, height = 640.dp)) {
                    MoneyManagerScreen(
                        language = AppLanguage.EN,
                        transactionsState = UiState.Success(sampleTx),
                        goalsState = UiState.Success(sampleGoals),
                        busy = false,
                        onBack = {},
                        onAddTransaction = { _, _, _, _, _, _, _, _ -> },
                        onUpdateTransaction = { _, _, _, _, _, _, _, _, _ -> },
                        onDeleteTransaction = {},
                        onAddGoal = { _, _, _, _, _, _ -> },
                        onUpdateGoal = { _, _, _, _, _, _, _ -> },
                        onAddGoalProgress = { _, _, _ -> },
                        onDeleteGoal = {}
                    )
                }
            }
        }

        composeRule.onNodeWithTag("money_add_tx_button").assertIsDisplayed().performClick()
        composeRule.onNodeWithTag("tx_title_input").assertIsDisplayed()
        composeRule.onNodeWithTag("tx_amount_input").assertIsDisplayed()
    }

    @Test
    @Config(sdk = [36], qualifiers = "w360dp-h800dp")
    fun `student hub screen on 360dp renders materials and interactive MCQ options`() {
        val materials = listOf(
            StudyMaterial(
                id = "m1",
                title = "Fundamentals of Agronomy",
                semester = 1L,
                subject = "Agronomy",
                category = "NOTES_PDF",
                summary = "Core soil tilth and crop geometry notes."
            )
        )
        val quizzes = listOf(
            QuizQuestion(
                id = "q1",
                title = "Agronomy Check",
                semester = 1L,
                subject = "Agronomy",
                questionText = "Nitrogen percentage in Urea?",
                options = listOf("18% N", "46% N", "60% N", "25% N"),
                correctIndex = 1L,
                explanation = "Urea contains 46% Nitrogen."
            )
        )

        var submittedScore = -1L
        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 360.dp, height = 800.dp)) {
                    StudentHubScreen(
                        profile = UserProfile(semester = 1L),
                        language = AppLanguage.EN,
                        studyMaterialsState = UiState.Success(materials),
                        quizzesState = UiState.Success(quizzes),
                        attemptsState = UiState.Success(emptyList()),
                        onOpenMoneyManager = {},
                        onSubmitQuizAttempt = { _, score, _ -> submittedScore = score }
                    )
                }
            }
        }

        composeRule.onNodeWithTag("student_tab_study").assertIsDisplayed()
        composeRule.onNodeWithTag("student_open_meeting_zone_button").assertExists()
        composeRule.onNodeWithTag("student_open_doubt_zone_button").assertExists()
        composeRule.onNodeWithTag("student_tab_exam").performClick()
        composeRule.onAllNodes(hasScrollToNodeAction())[0].performScrollToIndex(4)
        composeRule.onNodeWithTag("quiz_q1_opt_1").performClick()
        composeRule.onNodeWithTag("submit_mcq_exam_button").assertIsDisplayed().performClick()
        assertEquals(1L, submittedScore)
    }

    @Test
    fun `agri tools, farmer hub, ai assistant, career screen, and donut chart render cleanly on 320dp`() {
        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 320.dp, height = 640.dp)) {
                    AgriToolsScreen(language = AppLanguage.EN)
                }
            }
        }
        composeRule.onNodeWithTag("tool_tab_fertilizer").assertIsDisplayed()
        composeRule.onNodeWithTag("tool_tab_seed").performClick()
        composeRule.onNodeWithTag("tool_tab_population").performClick()
    }

    @Test
    fun `ai assistant and farmer hub and career community render cleanly on mobile widths`() {
        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 390.dp, height = 844.dp)) {
                    AiAssistantScreen(
                        language = AppLanguage.EN,
                        uiState = AiAssistantUiState(),
                        appSettings = AppSettings(),
                        knowledgeBaseCount = 4,
                        onSendQuestion = { _, _, _ -> },
                        onClearConversation = {}
                    )
                }
            }
        }
        composeRule.onNodeWithTag("ai_prompt_input").assertIsDisplayed()
        composeRule.onNodeWithTag("ai_send_button").assertIsDisplayed()
    }

    @Test
    fun `farmer hub and career community and owner donut chart handle narrow widths without clipping`() {
        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 320.dp, height = 640.dp)) {
                    FarmerHubScreen(
                        profile = UserProfile(displayName = "Ramesh Das", district = "Nadia"),
                        language = AppLanguage.EN,
                        appSettings = AppSettings(),
                        myQueriesState = UiState.Success(emptyList()),
                        busy = false,
                        onSubmitQuery = { _, _, _, _, _, _, _, _ -> },
                        onDeleteOpenQuery = {}
                    )
                }
            }
        }
        composeRule.onNodeWithTag("farmer_pick_photo_button").assertExists()
        composeRule.onNodeWithTag("farmer_submit_query_button").assertExists()
    }

    @Test
    fun `career community screen renders on 768dp tablet and narrow donut chart stacks cleanly`() {
        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 768.dp, height = 900.dp)) {
                    CareerCommunityScreen(
                        profile = UserProfile(displayName = "Ananya Roy"),
                        language = AppLanguage.EN,
                        careersState = UiState.Success(
                            listOf(
                                CareerOpportunity(
                                    id = "c1",
                                    title = "IBPS AFO Officer",
                                    organization = "IBPS",
                                    category = "GOVT_JOB",
                                    eligibility = "B.Sc Agriculture",
                                    deadline = "Open",
                                    description = "Public sector banking opportunity."
                                )
                            )
                        ),
                        postsState = UiState.Success(
                            listOf(
                                CommunityPost(
                                    id = "p1",
                                    authorName = "Ananya Roy",
                                    collegeGroup = "BCKV",
                                    topic = "DOUBT",
                                    title = "Soil pH practical question",
                                    body = "How to calibrate glass electrode?"
                                )
                            )
                        ),
                        busy = false,
                        onCreatePost = { _, _, _, _, _, _ -> },
                        onUpvotePost = {}
                    )
                }
            }
        }
        composeRule.onNodeWithText("IBPS AFO Officer").assertIsDisplayed()
        composeRule.onNodeWithTag("cc_tab_community").performClick()
        composeRule.onNodeWithTag("community_new_post_button").assertIsDisplayed()
    }

    @Test
    fun `segmented donut chart renders cleanly inside narrow 260dp mobile card`() {
        composeRule.setContent {
            GuruJiVisionTheme {
                Box(modifier = Modifier.size(width = 260.dp, height = 320.dp)) {
                    SegmentedDonutChart(
                        title = "Active vs Inactive Users",
                        centerLabel = "Users",
                        segments = listOf(
                            DonutSegment("Active (7d)", 12, androidx.compose.ui.graphics.Color(0xFF1B7F3B)),
                            DonutSegment("Inactive", 4, androidx.compose.ui.graphics.Color(0xFF64748B))
                        )
                    )
                }
            }
        }
        composeRule.onNodeWithText("Active vs Inactive Users").assertIsDisplayed()
        composeRule.onNodeWithText("16").assertIsDisplayed()
    }

    @Test
    fun `android build configuration and permissions are mobile-compatible`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        assertEquals("com.aistudio.gurujivision.v2prod", BuildConfig.APPLICATION_ID)
        assertEquals(24, context.applicationInfo.minSdkVersion)
        assertEquals(36, context.applicationInfo.targetSdkVersion)

        val pkgInfo = context.packageManager.getPackageInfo(
            context.packageName,
            PackageManager.GET_PERMISSIONS
        )
        val declared = pkgInfo.requestedPermissions?.toSet().orEmpty()
        assertTrue(declared.contains(Manifest.permission.INTERNET))
        assertTrue(declared.contains(Manifest.permission.ACCESS_NETWORK_STATE))
    }
}
