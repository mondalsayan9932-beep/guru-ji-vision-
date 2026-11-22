package com.example.ui.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Agriculture
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material.icons.outlined.Agriculture
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Calculate
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.launch

import androidx.credentials.CredentialManager
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.R
import com.example.core.AiGuruLocalStore
import com.example.core.AppLanguage
import com.example.core.FirestoreProvider
import com.example.core.L10n
import com.example.core.SessionPersistenceStore
import com.example.core.t
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.data.model.isUpcomingMeeting
import com.example.data.repository.AcademicRepository
import com.example.data.repository.AgriAiRepository
import com.example.data.repository.DoubtRepository
import com.example.data.repository.FarmerRepository
import com.example.data.repository.MeetingRepository
import com.example.data.repository.MoneyRepository
import com.example.data.repository.TelemetryRepository
import com.example.data.repository.UserRepository
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.LanguageTogglePill
import com.example.ui.screens.AdminDashboardScreen
import com.example.ui.screens.AgriToolsScreen
import com.example.ui.screens.AiAssistantScreen
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.CareerCommunityScreen
import com.example.ui.screens.DoubtZoneScreen
import com.example.ui.screens.FarmerHubScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.MeetingZoneScreen
import com.example.ui.screens.MoneyManagerScreen
import com.example.ui.screens.OnboardingScreen
import com.example.ui.screens.OwnerControlCenterScreen
import com.example.ui.screens.StudentHubScreen
import com.example.viewmodel.AdminViewModel
import com.example.viewmodel.AiAssistantViewModel
import com.example.viewmodel.AuthSessionUiState
import com.example.viewmodel.AuthSessionViewModel
import com.example.viewmodel.DoubtZoneViewModel
import com.example.viewmodel.EcosystemViewModel
import com.example.viewmodel.MeetingZoneViewModel
import com.example.viewmodel.OwnerControlViewModel

const val ROUTE_HOME = "home"
const val ROUTE_STUDENT = "student"
const val ROUTE_MONEY = "money"
const val ROUTE_FARMER = "farmer"
const val ROUTE_TOOLS = "tools"
const val ROUTE_AI = "ai"
const val ROUTE_CAREER_COMMUNITY = "career_community"
const val ROUTE_MEETING_ZONE = "meeting_zone"
const val ROUTE_DOUBT_ZONE = "doubt_zone"
const val ROUTE_ADMIN = "admin"
const val ROUTE_OWNER_CENTER = "owner_center"

private data class NavTab(
    val route: String,
    val label: (AppLanguage) -> String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val testTag: String
)

private val primaryTabs = listOf(
    NavTab(ROUTE_HOME, L10n::navHome, Icons.Filled.Home, Icons.Outlined.Home, "nav_home"),
    NavTab(ROUTE_STUDENT, L10n::navStudent, Icons.Filled.School, Icons.Outlined.School, "nav_student"),
    NavTab(ROUTE_FARMER, L10n::navFarmer, Icons.Filled.Agriculture, Icons.Outlined.Agriculture, "nav_farmer"),
    NavTab(ROUTE_TOOLS, L10n::navTools, Icons.Filled.Calculate, Icons.Outlined.Calculate, "nav_tools"),
    NavTab(ROUTE_AI, L10n::navAi, Icons.Filled.AutoAwesome, Icons.Outlined.AutoAwesome, "nav_ai"),
    NavTab(ROUTE_CAREER_COMMUNITY, L10n::navCommunity, Icons.Filled.WorkOutline, Icons.Outlined.WorkOutline, "nav_community")
)

// M3 mobile bottom navigation holds max 5 crisp items so 320dp-480dp phones never clip labels;
// Community, Money Manager, Meeting Zone, Doubt Zone, and Founder tools live in the collapsible Mobile Drawer.
private val mobileBottomTabs = primaryTabs.take(5)

@Composable
fun AppRoot(
    language: AppLanguage,
    onLanguageChange: (AppLanguage) -> Unit
) {
    val context = LocalContext.current
    val credentialManager = remember(context) { CredentialManager.create(context) }

    val authSessionVm: AuthSessionViewModel = viewModel(
        key = "guruji_auth_session",
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY])
                AuthSessionViewModel(
                    appContext = app.applicationContext,
                    sessionStore = SessionPersistenceStore(app.applicationContext)
                )
            }
        }
    )

    // Quietly verify/refresh Firebase ID token on foreground resume without ever logging out offline users
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner, authSessionVm) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_START) {
                authSessionVm.onAppForegrounded()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val sessionState by authSessionVm.sessionState.collectAsStateWithLifecycle()

    when (val state = sessionState) {
        is AuthSessionUiState.Restoring -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .testTag("session_restoring_screen"),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_guruji_logo_clean),
                        contentDescription = "Guru Ji Vision Logo",
                        modifier = Modifier
                            .size(64.dp)
                            .clip(RoundedCornerShape(16.dp)),
                        contentScale = ContentScale.Crop
                    )
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    Text(
                        text = t(
                            language,
                            "Restoring your Guru Ji Vision session...",
                            "আপনার গুরু জি ভিশন সেশন পুনরুদ্ধার হচ্ছে..."
                        ),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        is AuthSessionUiState.Unauthenticated -> {
            AuthScreen(
                language = language,
                onLanguageChange = onLanguageChange,
                allowAutoSignIn = state.allowAutoSignIn,
                onAuthSuccess = { authSessionVm.onSignInSuccess() }
            )
        }

        is AuthSessionUiState.Authenticated -> {
            // Key composition and all Firestore ViewModels strictly by authenticated UID
            key(state.userId) {
                AuthenticatedEcosystemShell(
                    currentUserId = state.userId,
                    userDisplayName = state.displayName,
                    userEmail = state.email,
                    userPhotoUrl = state.photoUrl,
                    isOnline = state.isOnline,
                    language = language,
                    onLanguageChange = onLanguageChange,
                    onExplicitSignOut = { authSessionVm.signOutExplicitly(credentialManager) }
                )
            }
        }
    }
}

@Composable
private fun ModulePausedPlaceholder(
    moduleTitle: String,
    language: AppLanguage
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        EmptyStateCard(
            title = if (language == AppLanguage.BN) "$moduleTitle সাময়িকভাবে বন্ধ আছে" else "$moduleTitle Temporarily Paused",
            description = if (language == AppLanguage.BN) {
                "প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেটর এই মডিউলটি আপডেটের জন্য সাময়িকভাবে বিরতি দিয়েছেন। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
            } else {
                "This module is currently paused by the Guru Ji Vision Platform Owner for maintenance or updates. Please check back shortly."
            },
            icon = Icons.Filled.Home
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AuthenticatedEcosystemShell(
    currentUserId: String,
    userDisplayName: String,
    userEmail: String,
    userPhotoUrl: String,
    isOnline: Boolean,
    language: AppLanguage,
    onLanguageChange: (AppLanguage) -> Unit,
    onExplicitSignOut: () -> Unit
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    val ecoViewModel: EcosystemViewModel = viewModel(
        key = "eco_$currentUserId",
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY])
                val db = FirestoreProvider.getInstance(app.applicationContext)
                val telem = TelemetryRepository(db)
                EcosystemViewModel(
                    currentUserId = currentUserId,
                    userRepo = UserRepository(db),
                    moneyRepo = MoneyRepository(db),
                    farmerRepo = FarmerRepository(db),
                    academicRepo = AcademicRepository(db),
                    aiRepo = AgriAiRepository(telem),
                    telemetryRepo = telem,
                    sessionStore = SessionPersistenceStore(app.applicationContext)
                )
            }
        }
    )

    val aiViewModel: AiAssistantViewModel = viewModel(
        key = "ai_$currentUserId",
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY])
                val db = FirestoreProvider.getInstance(app.applicationContext)
                AiAssistantViewModel(
                    aiRepo = AgriAiRepository(TelemetryRepository(db)),
                    localStore = AiGuruLocalStore(app.applicationContext),
                    userId = currentUserId
                )
            }
        }
    )

    val meetingViewModel: MeetingZoneViewModel = viewModel(
        key = "meeting_$currentUserId",
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY])
                val db = FirestoreProvider.getInstance(app.applicationContext)
                MeetingZoneViewModel(
                    currentUserId = currentUserId,
                    meetingRepo = MeetingRepository(db),
                    doubtRepo = DoubtRepository(db),
                    userRepo = UserRepository(db),
                    telemetryRepo = TelemetryRepository(db)
                )
            }
        }
    )

    val doubtViewModel: DoubtZoneViewModel = viewModel(
        key = "doubt_$currentUserId",
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY])
                val db = FirestoreProvider.getInstance(app.applicationContext)
                DoubtZoneViewModel(
                    currentUserId = currentUserId,
                    doubtRepo = DoubtRepository(db),
                    telemetryRepo = TelemetryRepository(db)
                )
            }
        }
    )

    val profileState by ecoViewModel.profileState.collectAsStateWithLifecycle()
    val isFounder by ecoViewModel.isFounder.collectAsStateWithLifecycle()
    val announcementsState by ecoViewModel.announcementsState.collectAsStateWithLifecycle()
    val appSettings by ecoViewModel.appSettings.collectAsStateWithLifecycle()
    val actionMessage by ecoViewModel.actionMessage.collectAsStateWithLifecycle()
    val actionBusy by ecoViewModel.actionBusy.collectAsStateWithLifecycle()
    val totalUnreadDoubts by doubtViewModel.totalUnreadCount.collectAsStateWithLifecycle()
    val facultyIdentity by doubtViewModel.facultyIdentity.collectAsStateWithLifecycle()
    val meetingsState by meetingViewModel.meetingsState.collectAsStateWithLifecycle()
    val upcomingMeetingsCount = remember(meetingsState) {
        val list = (meetingsState as? UiState.Success)?.data.orEmpty()
        val now = System.currentTimeMillis()
        list.count { isUpcomingMeeting(it, now) }
    }

    // Retain last known valid UserProfile in memory so a brief network drop NEVER unmounts NavHost
    var lastKnownProfile by remember(currentUserId) { mutableStateOf<UserProfile?>(null) }
    val liveProfile = (profileState as? UiState.Success)?.data
    if (liveProfile != null && liveProfile != lastKnownProfile) {
        lastKnownProfile = liveProfile
    }
    val userProfile = liveProfile ?: lastKnownProfile

    // Show loading spinner ONLY on initial load when no cached/last-known profile exists yet
    if (profileState is UiState.Loading && userProfile == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    // First-time signed-in user completes Student / Farmer onboarding profile
    // (Only shown when server confirms no profile exists and no cached profile exists)
    if (profileState is UiState.Success && liveProfile == null && lastKnownProfile == null) {
        OnboardingScreen(
            initialName = userDisplayName,
            initialEmail = userEmail,
            initialPhotoUrl = userPhotoUrl,
            language = language,
            onLanguageChange = onLanguageChange,
            busy = actionBusy,
            onCompleteRegistration = { name, role, inst, dist, sem, langCode ->
                ecoViewModel.saveProfile(
                    displayName = name,
                    role = role,
                    institutionOrVillage = inst,
                    district = dist,
                    semester = sem,
                    language = langCode,
                    isExisting = false
                )
            }
        )
        return
    }

    // Record real active presence heartbeat & session activity once per authenticated session
    LaunchedEffect(userProfile?.userId) {
        if (userProfile != null) {
            ecoViewModel.recordSessionHeartbeatIfNeeded(userProfile.role)
        }
    }

    val navController = rememberNavController()
    val navBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStack?.destination?.route ?: ROUTE_HOME
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(actionMessage) {
        val msg = actionMessage
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            ecoViewModel.clearMessage()
        }
    }

    val navigateToTab: (String) -> Unit = { route ->
        navController.navigate(route) {
            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    val isFullScreenRoute = currentRoute == ROUTE_ADMIN ||
        currentRoute == ROUTE_MONEY ||
        currentRoute == ROUTE_OWNER_CENTER ||
        currentRoute == ROUTE_MEETING_ZONE ||
        currentRoute == ROUTE_DOUBT_ZONE

    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val drawerScope = rememberCoroutineScope()

    val toggleLanguage: (AppLanguage) -> Unit = { nextLang ->
        onLanguageChange(nextLang)
        if (userProfile != null) {
            ecoViewModel.saveProfile(
                displayName = userProfile.displayName,
                role = userProfile.role,
                institutionOrVillage = userProfile.institutionOrVillage,
                district = userProfile.district,
                semester = userProfile.semester,
                language = nextLang.code,
                isExisting = true
            )
        }
    }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val useRail = maxWidth >= 600.dp
        val isUltraCompact = maxWidth < 360.dp
        val isNarrowPhone = maxWidth < 400.dp

        BackHandler(enabled = drawerState.isOpen) {
            drawerScope.launch { drawerState.close() }
        }

        ModalNavigationDrawer(
            drawerState = drawerState,
            gesturesEnabled = !useRail && !isFullScreenRoute,
            drawerContent = {
                ModalDrawerSheet(
                    modifier = Modifier.widthIn(max = 300.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(vertical = 12.dp)
                    ) {
                        // Drawer Brand & User Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            val avatarUrl = userProfile?.photoUrl?.ifBlank { userPhotoUrl } ?: userPhotoUrl
                            if (avatarUrl.isNotBlank()) {
                                AsyncImage(
                                    model = avatarUrl,
                                    contentDescription = "User profile photo",
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Image(
                                    painter = painterResource(id = R.drawable.ic_guruji_logo_clean),
                                    contentDescription = "Guru Ji Vision Logo",
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(12.dp)),
                                    contentScale = ContentScale.Crop
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = userProfile?.displayName?.ifBlank { L10n.brandName(language) }
                                        ?: L10n.brandName(language),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = userEmail.ifBlank { userProfile?.email.orEmpty() },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                        // All Primary Modules
                        primaryTabs.forEach { tab ->
                            val selected = currentRoute == tab.route
                            NavigationDrawerItem(
                                label = { Text(tab.label(language), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                selected = selected,
                                onClick = {
                                    drawerScope.launch { drawerState.close() }
                                    navigateToTab(tab.route)
                                },
                                icon = {
                                    Icon(
                                        imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,
                                        contentDescription = tab.label(language)
                                    )
                                },
                                modifier = Modifier
                                    .padding(NavigationDrawerItemDefaults.ItemPadding)
                                    .testTag("drawer_${tab.route}")
                            )
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                        NavigationDrawerItem(
                            label = { Text(L10n.meetingZone(language), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                            selected = currentRoute == ROUTE_MEETING_ZONE,
                            onClick = {
                                drawerScope.launch { drawerState.close() }
                                navController.navigate(ROUTE_MEETING_ZONE)
                            },
                            icon = { Icon(Icons.Filled.VideoCall, contentDescription = L10n.meetingZone(language)) },
                            badge = {
                                if (upcomingMeetingsCount > 0) {
                                    Badge { Text(upcomingMeetingsCount.toString()) }
                                }
                            },
                            modifier = Modifier
                                .padding(NavigationDrawerItemDefaults.ItemPadding)
                                .testTag("drawer_meeting_zone")
                        )

                        NavigationDrawerItem(
                            label = { Text(L10n.doubtZone(language), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                            selected = currentRoute == ROUTE_DOUBT_ZONE,
                            onClick = {
                                drawerScope.launch { drawerState.close() }
                                navController.navigate(ROUTE_DOUBT_ZONE)
                            },
                            icon = { Icon(Icons.Filled.Forum, contentDescription = L10n.doubtZone(language)) },
                            badge = {
                                if (totalUnreadDoubts > 0) {
                                    Badge { Text(if (totalUnreadDoubts > 99) "99+" else totalUnreadDoubts.toString()) }
                                }
                            },
                            modifier = Modifier
                                .padding(NavigationDrawerItemDefaults.ItemPadding)
                                .testTag("drawer_doubt_zone")
                        )

                        NavigationDrawerItem(
                            label = { Text("${L10n.moneyManager(language)} (₹)", maxLines = 1, overflow = TextOverflow.Ellipsis) },
                            selected = currentRoute == ROUTE_MONEY,
                            onClick = {
                                drawerScope.launch { drawerState.close() }
                                navController.navigate(ROUTE_MONEY)
                            },
                            icon = { Icon(Icons.Filled.AccountBalanceWallet, contentDescription = L10n.moneyManager(language)) },
                            modifier = Modifier
                                .padding(NavigationDrawerItemDefaults.ItemPadding)
                                .testTag("drawer_money_manager")
                        )

                        if (isFounder) {
                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                            NavigationDrawerItem(
                                label = { Text(t(language, "Owner Control Center", "ওনার কন্ট্রোল সেন্টার"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                selected = currentRoute == ROUTE_OWNER_CENTER,
                                onClick = {
                                    drawerScope.launch { drawerState.close() }
                                    navController.navigate(ROUTE_OWNER_CENTER)
                                },
                                icon = { Icon(Icons.Filled.MonitorHeart, contentDescription = "Owner Control Center") },
                                modifier = Modifier
                                    .padding(NavigationDrawerItemDefaults.ItemPadding)
                                    .testTag("drawer_owner_center")
                            )
                            NavigationDrawerItem(
                                label = { Text(L10n.adminDashboard(language), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                selected = currentRoute == ROUTE_ADMIN,
                                onClick = {
                                    drawerScope.launch { drawerState.close() }
                                    navController.navigate(ROUTE_ADMIN)
                                },
                                icon = { Icon(Icons.Filled.AdminPanelSettings, contentDescription = L10n.adminDashboard(language)) },
                                modifier = Modifier
                                    .padding(NavigationDrawerItemDefaults.ItemPadding)
                                    .testTag("drawer_admin_dashboard")
                            )
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = t(language, "Language", "ভাষা"),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            LanguageTogglePill(
                                language = language,
                                onToggle = toggleLanguage
                            )
                        }

                        NavigationDrawerItem(
                            label = {
                                Text(
                                    text = L10n.signOut(language),
                                    color = MaterialTheme.colorScheme.error,
                                    maxLines = 1
                                )
                            },
                            selected = false,
                            onClick = {
                                drawerScope.launch { drawerState.close() }
                                showLogoutDialog = true
                            },
                            icon = {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.Logout,
                                    contentDescription = L10n.signOut(language),
                                    tint = MaterialTheme.colorScheme.error
                                )
                            },
                            modifier = Modifier
                                .padding(NavigationDrawerItemDefaults.ItemPadding)
                                .testTag("drawer_logout_button")
                        )
                    }
                }
            }
        ) {
            Scaffold(
                snackbarHost = { SnackbarHost(snackbarHostState) },
                topBar = {
                    if (!isFullScreenRoute) {
                        TopAppBar(
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            ),
                            navigationIcon = {
                                if (!useRail) {
                                    IconButton(
                                        onClick = { drawerScope.launch { drawerState.open() } },
                                        modifier = Modifier.testTag("mobile_drawer_button")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Menu,
                                            contentDescription = t(language, "Open navigation menu", "নেভিগেশন মেনু খুলুন"),
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            },
                            title = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(if (isUltraCompact) 6.dp else 10.dp)
                                ) {
                                    Image(
                                        painter = painterResource(id = R.drawable.ic_guruji_logo_clean),
                                        contentDescription = "Guru Ji Vision Logo",
                                        modifier = Modifier
                                            .size(if (isUltraCompact) 28.dp else 32.dp)
                                            .clip(RoundedCornerShape(8.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                    Text(
                                        text = L10n.brandName(language),
                                        style = if (isUltraCompact) MaterialTheme.typography.titleMedium else MaterialTheme.typography.titleLarge,
                                        color = MaterialTheme.colorScheme.primary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            },
                            actions = {
                                IconButton(
                                    onClick = { navController.navigate(ROUTE_MEETING_ZONE) },
                                    modifier = Modifier.testTag("topbar_meeting_zone")
                                ) {
                                    BadgedBox(
                                        badge = {
                                            if (upcomingMeetingsCount > 0) {
                                                Badge { Text(upcomingMeetingsCount.toString()) }
                                            }
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.VideoCall,
                                            contentDescription = L10n.meetingZone(language),
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                                IconButton(
                                    onClick = { navController.navigate(ROUTE_DOUBT_ZONE) },
                                    modifier = Modifier.testTag("topbar_doubt_zone")
                                ) {
                                    BadgedBox(
                                        badge = {
                                            if (totalUnreadDoubts > 0) {
                                                Badge {
                                                    Text(if (totalUnreadDoubts > 99) "99+" else totalUnreadDoubts.toString())
                                                }
                                            }
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Forum,
                                            contentDescription = L10n.doubtZone(language),
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                                LanguageTogglePill(
                                    language = language,
                                    onToggle = toggleLanguage,
                                    compact = isNarrowPhone,
                                    modifier = Modifier.padding(end = if (isNarrowPhone) 6.dp else 4.dp)
                                )
                                if (!isNarrowPhone) {
                                    IconButton(
                                        onClick = { showLogoutDialog = true },
                                        modifier = Modifier.testTag("topbar_logout_button")
                                    ) {
                                        Icon(
                                            imageVector = Icons.AutoMirrored.Filled.Logout,
                                            contentDescription = L10n.signOut(language),
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        )
                    }
                },
                bottomBar = {
                    if (!useRail && !isFullScreenRoute) {
                        NavigationBar {
                            mobileBottomTabs.forEach { tab ->
                                val selected = currentRoute == tab.route
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = { navigateToTab(tab.route) },
                                    icon = {
                                        Icon(
                                            imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,
                                            contentDescription = tab.label(language)
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = tab.label(language),
                                            maxLines = 1,
                                            softWrap = false,
                                            overflow = TextOverflow.Ellipsis,
                                            fontSize = if (isUltraCompact) 10.sp else 11.sp
                                        )
                                    },
                                    modifier = Modifier.testTag(tab.testTag)
                                )
                            }
                        }
                    }
                }
            ) { innerPadding ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .consumeWindowInsets(innerPadding)
                ) {
                    if (!isOnline) {
                        Surface(
                            color = Color(0xFFFFFBEB),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("offline_session_banner")
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.CloudOff,
                                    contentDescription = "Offline Mode",
                                    tint = Color(0xFFB45309),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = t(
                                        language,
                                        "Offline mode — your login session stays active and will sync automatically when reconnected.",
                                        "অফলাইন মোড — আপনার লগইন সেশন সক্রিয় আছে, ইন্টারনেট ফিরলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।"
                                    ),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color(0xFF78350F)
                                )
                            }
                        }
                    }
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                    ) {
                        if (useRail && !isFullScreenRoute) {
                            NavigationRail {
                                Column(
                                    modifier = Modifier.verticalScroll(rememberScrollState()),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    primaryTabs.forEach { tab ->
                                        val selected = currentRoute == tab.route
                                        NavigationRailItem(
                                            selected = selected,
                                            onClick = { navigateToTab(tab.route) },
                                            icon = {
                                                Icon(
                                                    imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,
                                                    contentDescription = tab.label(language)
                                                )
                                            },
                                            label = { Text(tab.label(language), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                            modifier = Modifier.testTag(tab.testTag)
                                        )
                                    }
                                    NavigationRailItem(
                                        selected = currentRoute == ROUTE_MEETING_ZONE,
                                        onClick = { navController.navigate(ROUTE_MEETING_ZONE) },
                                        icon = {
                                            BadgedBox(
                                                badge = {
                                                    if (upcomingMeetingsCount > 0) {
                                                        Badge { Text(upcomingMeetingsCount.toString()) }
                                                    }
                                                }
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Filled.VideoCall,
                                                    contentDescription = L10n.meetingZone(language)
                                                )
                                            }
                                        },
                                        label = { Text(L10n.meetingZone(language), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                        modifier = Modifier.testTag("rail_meeting_zone")
                                    )
                                    NavigationRailItem(
                                        selected = currentRoute == ROUTE_DOUBT_ZONE,
                                        onClick = { navController.navigate(ROUTE_DOUBT_ZONE) },
                                        icon = {
                                            BadgedBox(
                                                badge = {
                                                    if (totalUnreadDoubts > 0) {
                                                        Badge { Text(totalUnreadDoubts.toString()) }
                                                    }
                                                }
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Filled.Forum,
                                                    contentDescription = L10n.doubtZone(language)
                                                )
                                            }
                                        },
                                        label = { Text(L10n.doubtZone(language), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                        modifier = Modifier.testTag("rail_doubt_zone")
                                    )
                                    NavigationRailItem(
                                        selected = currentRoute == ROUTE_MONEY,
                                        onClick = { navController.navigate(ROUTE_MONEY) },
                                        icon = {
                                            Icon(
                                                imageVector = Icons.Filled.AccountBalanceWallet,
                                                contentDescription = L10n.moneyManager(language)
                                            )
                                        },
                                        label = { Text(t(language, "Money ₹", "হিসাব ₹"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                        modifier = Modifier.testTag("rail_money_manager")
                                    )
                                }
                            }
                        }

                        NavHost(
                            navController = navController,
                            startDestination = ROUTE_HOME,
                            modifier = Modifier.weight(1f)
                        ) {
                    composable(ROUTE_HOME) {
                        HomeScreen(
                            profile = userProfile,
                            userPhotoUrl = userPhotoUrl,
                            isFounder = isFounder,
                            language = language,
                            announcementsState = announcementsState,
                            appSettings = appSettings,
                            onOpenStudent = { navigateToTab(ROUTE_STUDENT) },
                            onOpenMoneyManager = { navController.navigate(ROUTE_MONEY) },
                            onOpenFarmer = { navigateToTab(ROUTE_FARMER) },
                            onOpenTools = { navigateToTab(ROUTE_TOOLS) },
                            onOpenAi = { navigateToTab(ROUTE_AI) },
                            onOpenCareerCommunity = { navigateToTab(ROUTE_CAREER_COMMUNITY) },
                            onOpenAdmin = {
                                if (isFounder) navController.navigate(ROUTE_ADMIN)
                            },
                            onOpenOwnerCenter = {
                                if (isFounder) navController.navigate(ROUTE_OWNER_CENTER)
                            },
                            onSignOut = {
                                showLogoutDialog = true
                            },
                            upcomingMeetingsCount = upcomingMeetingsCount,
                            unreadDoubtsCount = totalUnreadDoubts,
                            isAuthorizedProfessor = facultyIdentity.isAuthorizedProfessor,
                            onOpenMeetingZone = { navController.navigate(ROUTE_MEETING_ZONE) },
                            onOpenDoubtZone = { navController.navigate(ROUTE_DOUBT_ZONE) }
                        )
                    }

                    composable(ROUTE_STUDENT) {
                        if (!appSettings.studentModuleEnabled && !isFounder) {
                            ModulePausedPlaceholder("B.Sc Student Portal", language)
                        } else {
                            val studyMaterialsState by ecoViewModel.studyMaterialsState.collectAsStateWithLifecycle()
                            val quizzesState by ecoViewModel.quizzesState.collectAsStateWithLifecycle()
                            val myQuizAttemptsState by ecoViewModel.myQuizAttemptsState.collectAsStateWithLifecycle()
                            StudentHubScreen(
                                profile = userProfile,
                                language = language,
                                studyMaterialsState = studyMaterialsState,
                                quizzesState = quizzesState,
                                attemptsState = myQuizAttemptsState,
                                onOpenMoneyManager = { navController.navigate(ROUTE_MONEY) },
                                onSubmitQuizAttempt = { sem, score, total ->
                                    ecoViewModel.recordQuizAttempt(sem, score, total)
                                },
                                unreadDoubtsCount = totalUnreadDoubts,
                                onOpenMeetingZone = { navController.navigate(ROUTE_MEETING_ZONE) },
                                onOpenDoubtZone = { navController.navigate(ROUTE_DOUBT_ZONE) }
                            )
                        }
                    }

                    composable(ROUTE_MONEY) {
                        if (!appSettings.moneyManagerEnabled && !isFounder) {
                            ModulePausedPlaceholder("Student Money Manager", language)
                        } else {
                            val transactionsState by ecoViewModel.transactionsState.collectAsStateWithLifecycle()
                            val goalsState by ecoViewModel.goalsState.collectAsStateWithLifecycle()
                            MoneyManagerScreen(
                                language = language,
                                transactionsState = transactionsState,
                                goalsState = goalsState,
                                busy = actionBusy,
                                onBack = { navController.popBackStack() },
                                onAddTransaction = { title, amt, type, cat, note, date, shared, done ->
                                    ecoViewModel.addMoneyTransaction(title, amt, type, cat, note, date, shared, done)
                                },
                                onUpdateTransaction = { txId, title, amt, type, cat, note, date, shared, done ->
                                    ecoViewModel.updateMoneyTransaction(txId, title, amt, type, cat, note, date, shared, done)
                                },
                                onDeleteTransaction = { ecoViewModel.deleteMoneyTransaction(it) },
                                onAddGoal = { name, kind, target, saved, month, done ->
                                    ecoViewModel.addFinancialGoal(name, kind, target, saved, month, done)
                                },
                                onUpdateGoal = { goalId, name, kind, target, saved, month, done ->
                                    ecoViewModel.updateFinancialGoal(goalId, name, kind, target, saved, month, done)
                                },
                                onAddGoalProgress = { id, curr, delta ->
                                    ecoViewModel.addProgressToGoal(id, curr, delta)
                                },
                                onDeleteGoal = { ecoViewModel.deleteFinancialGoal(it) }
                            )
                        }
                    }

                    composable(ROUTE_FARMER) {
                        if (!appSettings.farmerModuleEnabled && !isFounder) {
                            ModulePausedPlaceholder("Farmer Portal", language)
                        } else {
                            val myFarmerQueriesState by ecoViewModel.myFarmerQueriesState.collectAsStateWithLifecycle()
                            FarmerHubScreen(
                                profile = userProfile,
                                language = language,
                                appSettings = appSettings,
                                myQueriesState = myFarmerQueriesState,
                                busy = actionBusy,
                                onSubmitQuery = { fName, crop, cat, desc, dist, bmp, lang, done ->
                                    ecoViewModel.submitFarmerQuery(fName, crop, cat, desc, dist, bmp, lang, done)
                                },
                                onDeleteOpenQuery = { ecoViewModel.deleteOpenFarmerQuery(it) }
                            )
                        }
                    }

                    composable(ROUTE_TOOLS) {
                        if (!appSettings.toolsModuleEnabled && !isFounder) {
                            ModulePausedPlaceholder("Agriculture Calculators", language)
                        } else {
                            AgriToolsScreen(language = language)
                        }
                    }

                    composable(ROUTE_AI) {
                        if (!appSettings.aiAssistantEnabled && !isFounder) {
                            ModulePausedPlaceholder(L10n.aiAssistant(language), language)
                        } else {
                            val studyMaterialsState by ecoViewModel.studyMaterialsState.collectAsStateWithLifecycle()
                            val aiUiState by aiViewModel.uiState.collectAsStateWithLifecycle()
                            val publishedMaterials = (studyMaterialsState as? UiState.Success)?.data.orEmpty()
                            val verifiedKbCount = publishedMaterials.count { it.published && it.verifiedForAi }
                            AiAssistantScreen(
                                language = language,
                                uiState = aiUiState,
                                appSettings = appSettings,
                                knowledgeBaseCount = verifiedKbCount,
                                onSelectStudyMode = { mode -> aiViewModel.selectStudyMode(mode) },
                                onToggleFreeWebSearch = { enabled -> aiViewModel.toggleFreeWebSearch(enabled) },
                                onSendQuestion = { q, bmp, lang ->
                                    aiViewModel.sendQuestion(
                                        question = q,
                                        attachedBitmap = bmp,
                                        language = lang,
                                        appSettings = appSettings,
                                        knowledgeBaseMaterials = publishedMaterials
                                    )
                                },
                                onClearConversation = { aiViewModel.clearConversation() }
                            )
                        }
                    }

                    composable(ROUTE_CAREER_COMMUNITY) {
                        if (!appSettings.careerModuleEnabled && !appSettings.communityModuleEnabled && !isFounder) {
                            ModulePausedPlaceholder("Career & Community", language)
                        } else {
                            val careersState by ecoViewModel.careersState.collectAsStateWithLifecycle()
                            val communityPostsState by ecoViewModel.communityPostsState.collectAsStateWithLifecycle()
                            CareerCommunityScreen(
                                profile = userProfile,
                                language = language,
                                careersState = careersState,
                                postsState = communityPostsState,
                                busy = actionBusy,
                                onCreatePost = { author, group, topic, title, body, done ->
                                    ecoViewModel.createCommunityPost(author, group, topic, title, body, done)
                                },
                                onUpvotePost = { ecoViewModel.upvoteCommunityPost(it) },
                                onReportPost = { post, reason, done ->
                                    ecoViewModel.submitContentReport(post, reason, done)
                                }
                            )
                        }
                    }

                    composable(ROUTE_MEETING_ZONE) {
                        if (!appSettings.meetingZoneEnabled && !isFounder) {
                            ModulePausedPlaceholder(L10n.meetingZone(language), language)
                        } else {
                            MeetingZoneScreen(
                                profile = userProfile,
                                language = language,
                                meetingViewModel = meetingViewModel,
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }

                    composable(ROUTE_DOUBT_ZONE) {
                        if (!appSettings.doubtZoneEnabled && !isFounder) {
                            ModulePausedPlaceholder(L10n.doubtZoneFull(language), language)
                        } else {
                            DoubtZoneScreen(
                                profile = userProfile,
                                language = language,
                                doubtViewModel = doubtViewModel,
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }

                    composable(ROUTE_ADMIN) {
                        // Block manual navigation by any non-Founder user and never initialize AdminViewModel
                        LaunchedEffect(isFounder) {
                            if (!isFounder) {
                                navController.popBackStack(ROUTE_HOME, inclusive = false)
                            }
                        }

                        val adminVm: AdminViewModel? = if (isFounder) {
                            viewModel(
                                key = "admin_$currentUserId",
                                factory = viewModelFactory {
                                    initializer {
                                        val app = checkNotNull(this[APPLICATION_KEY])
                                        val db = FirestoreProvider.getInstance(app.applicationContext)
                                        val telemetry = TelemetryRepository(db)
                                        AdminViewModel(
                                            userRepo = UserRepository(db),
                                            farmerRepo = FarmerRepository(db),
                                            academicRepo = AcademicRepository(db),
                                            telemetryRepo = telemetry,
                                            doubtRepo = DoubtRepository(db),
                                            aiRepo = AgriAiRepository(telemetry)
                                        )
                                    }
                                }
                            )
                        } else null

                        AdminDashboardScreen(
                            isFounder = isFounder,
                            language = language,
                            appSettings = appSettings,
                            adminViewModel = adminVm,
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(ROUTE_OWNER_CENTER) {
                        // Block manual navigation by any non-Founder user and never initialize OwnerControlViewModel
                        LaunchedEffect(isFounder) {
                            if (!isFounder) {
                                navController.popBackStack(ROUTE_HOME, inclusive = false)
                            }
                        }

                        val ownerVm: OwnerControlViewModel? = if (isFounder) {
                            viewModel(
                                key = "owner_$currentUserId",
                                factory = viewModelFactory {
                                    initializer {
                                        val app = checkNotNull(this[APPLICATION_KEY])
                                        val db = FirestoreProvider.getInstance(app.applicationContext)
                                        OwnerControlViewModel(
                                            userRepo = UserRepository(db),
                                            farmerRepo = FarmerRepository(db),
                                            academicRepo = AcademicRepository(db),
                                            telemetryRepo = TelemetryRepository(db)
                                        )
                                    }
                                }
                            )
                        } else null

                        OwnerControlCenterScreen(
                            isFounder = isFounder,
                            appSettings = appSettings,
                            ownerViewModel = ownerVm,
                            onBack = { navController.popBackStack() },
                            onOpenAdminContentConsole = {
                                if (isFounder) navController.navigate(ROUTE_ADMIN)
                            }
                        )
                    }
                }
                }
            }
        }
        }
    }

    if (showLogoutDialog) {
        val accountLabel = userEmail.ifBlank { userProfile?.email.orEmpty() }
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Text(
                    text = t(language, "Log out of Guru Ji Vision?", "গুরু জি ভিশন থেকে লগআউট করবেন?"),
                    style = MaterialTheme.typography.titleLarge
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = t(
                            language,
                            "Your session stays signed in automatically unless you choose to log out. Do you want to sign out now?",
                            "আপনি নিজে লগআউট না করা পর্যন্ত আপনার সেশন স্বয়ংক্রিয়ভাবে চালু থাকবে। আপনি কি এখন লগআউট করতে চান?"
                        ),
                        style = MaterialTheme.typography.bodyMedium
                    )
                    if (accountLabel.isNotBlank()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = accountLabel,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onExplicitSignOut()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error,
                        contentColor = MaterialTheme.colorScheme.onError
                    ),
                    modifier = Modifier.testTag("confirm_logout_button")
                ) {
                    Text(L10n.signOut(language))
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showLogoutDialog = false },
                    modifier = Modifier.testTag("cancel_logout_button")
                ) {
                    Text(t(language, "Stay Logged In", "লগইন থাকুন"))
                }
            }
        )
    }
}
