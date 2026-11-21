package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Agriculture
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.R
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.data.model.Announcement
import com.example.data.model.AppSettings
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.ui.components.PortalFeatureCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.WhatsAppSupportButton
import com.example.ui.components.openWhatsAppGroupInvite

@Composable
fun HomeScreen(
    profile: UserProfile?,
    userPhotoUrl: String = "",
    isFounder: Boolean,
    language: AppLanguage,
    announcementsState: UiState<List<Announcement>>,
    appSettings: AppSettings,
    onOpenStudent: () -> Unit,
    onOpenMoneyManager: () -> Unit,
    onOpenFarmer: () -> Unit,
    onOpenTools: () -> Unit,
    onOpenAi: () -> Unit,
    onOpenCareerCommunity: () -> Unit,
    onOpenAdmin: () -> Unit,
    onOpenOwnerCenter: () -> Unit,
    onSignOut: () -> Unit,
    upcomingMeetingsCount: Int = 0,
    unreadDoubtsCount: Int = 0,
    isAuthorizedProfessor: Boolean = false,
    onOpenMeetingZone: () -> Unit = {},
    onOpenDoubtZone: () -> Unit = {}
) {
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Live Maintenance / Priority Banner set by Platform Owner
        if (appSettings.maintenanceBanner.isNotBlank()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("home_maintenance_banner"),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
                    border = BorderStroke(1.dp, Color(0xFFF59E0B))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Info,
                            contentDescription = "Platform Notice",
                            tint = Color(0xFFB45309)
                        )
                        Text(
                            text = appSettings.maintenanceBanner,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF78350F)
                        )
                    }
                }
            }
        }

        // Editorial Hero Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(210.dp)
                    .clip(MaterialTheme.shapes.large)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.img_hero_agri_banner_1795234984548),
                    contentDescription = "Guru Ji Vision Farmland Hero",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(
                                    Color(0xFF0A2E18).copy(alpha = 0.25f),
                                    Color(0xFF0A2E18).copy(alpha = 0.88f)
                                )
                            )
                        )
                )
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        StatusPill(
                            label = if (isFounder) {
                                t(language, "FOUNDER / OWNER", "ফাউন্ডার / ওনার")
                            } else if (isAuthorizedProfessor) {
                                t(language, "FACULTY ADVISOR", "অধ্যাপক / উপদেষ্টা")
                            } else if (profile?.role == "FARMER") {
                                L10n.farmerRole(language).uppercase()
                            } else {
                                L10n.studentRole(language).uppercase()
                            },
                            containerColor = MaterialTheme.colorScheme.secondary,
                            contentColor = Color.White
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (profile != null && profile.role == "STUDENT" && profile.semester > 0) {
                                StatusPill(
                                    label = "B.Sc Agri • Sem ${profile.semester}",
                                    containerColor = Color.White.copy(alpha = 0.2f),
                                    contentColor = Color.White
                                )
                            }
                            val avatarUrl = profile?.photoUrl?.ifBlank { userPhotoUrl } ?: userPhotoUrl
                            if (avatarUrl.isNotBlank()) {
                                AsyncImage(
                                    model = avatarUrl,
                                    contentDescription = "Google Profile Photo",
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = t(
                                language,
                                "Namaste, ${profile?.displayName?.ifBlank { "Friend" } ?: "Member"}",
                                "নমস্কার, ${profile?.displayName?.ifBlank { "বন্ধু" } ?: "সদস্য"}"
                            ),
                            style = MaterialTheme.typography.headlineSmall,
                            color = Color.White
                        )
                        Text(
                            text = appSettings.heroHeadline.ifBlank { L10n.tagline(language) },
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    }
                }
            }
        }

        // Protected Owner Monitoring & Control Center Card (Strictly Verified Founder ONLY)
        if (isFounder) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("home_owner_control_card"),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF0E3F24)
                    ),
                    border = BorderStroke(1.5.dp, Color(0xFF4ADE80))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.MonitorHeart,
                                contentDescription = "Owner Monitoring Center",
                                tint = Color(0xFF86EFAC),
                                modifier = Modifier.size(32.dp)
                            )
                            Column {
                                Text(
                                    text = t(language, "Owner Monitoring & Control Center", "ওনার মনিটরিং ও কন্ট্রোল সেন্টার"),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color.White
                                )
                                Text(
                                    text = t(
                                        language,
                                        "Live analytics, Gemini AI usage/cost, audit logs, feature toggles & CSV/PDF reports",
                                        "রিয়েল-টাইম অ্যানালিটিক্স, AI খরচ, অডিট লগ ও CSV/PDF রিপোর্ট"
                                    ),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.White.copy(alpha = 0.85f)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = onOpenOwnerCenter,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF4ADE80),
                                contentColor = Color(0xFF0A2E18)
                            ),
                            modifier = Modifier.testTag("open_owner_center_button")
                        ) {
                            Text(t(language, "Monitor", "মনিটর"))
                        }
                    }
                }
            }
        }

        // Protected Admin Dashboard Banner (Strictly Verified Founder / Owner ONLY — Hidden from Students & Farmers)
        if (isFounder) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("home_admin_card"),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    ),
                    border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.AdminPanelSettings,
                                contentDescription = "Admin Dashboard",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(30.dp)
                            )
                            Column {
                                Text(
                                    text = L10n.adminDashboard(language),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = t(
                                        language,
                                        "Manage students, farmer queries, notes, quizzes & settings",
                                        "শিক্ষার্থী, কৃষক প্রশ্ন, নোটস ও সেটিংস পরিচালনা করুন"
                                    ),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = onOpenAdmin,
                            modifier = Modifier.testTag("open_admin_dashboard_button")
                        ) {
                            Text(t(language, "Open", "খুলুন"))
                        }
                    }
                }
            }
        }

        // Live Announcements from Firestore
        if (announcementsState is UiState.Success && announcementsState.data.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.65f)
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary.copy(alpha = 0.35f))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Campaign,
                                contentDescription = "Announcements",
                                tint = MaterialTheme.colorScheme.secondary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = t(language, "Latest Notices", "সর্বশেষ বিজ্ঞপ্তি"),
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                        announcementsState.data.take(3).forEach { notice ->
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = notice.title,
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = notice.message,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Core Ecosystem Portals
        item {
            SectionHeader(
                title = t(language, "Ecosystem Modules", "ইকোসিস্টেম মডিউল"),
                subtitle = t(language, "Tap any module to launch", "যেকোনো বিভাগে প্রবেশ করুন")
            )
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                PortalFeatureCard(
                    title = t(language, "B.Sc Agriculture Student Portal", "B.Sc কৃষি শিক্ষার্থী পোর্টাল"),
                    subtitle = t(language, "Semester 1–8 notes, video lectures, PYQs, practicals & online MCQ exams", "সেমিস্টার ১–৮ নোটস, ভিডিও, PYQ, প্র্যাকটিক্যাল ও অনলাইন MCQ পরীক্ষা"),
                    icon = Icons.Filled.School,
                    accentColor = MaterialTheme.colorScheme.primary,
                    tag = "home_portal_student",
                    onClick = onOpenStudent
                )
                PortalFeatureCard(
                    title = if (upcomingMeetingsCount > 0) {
                        "${L10n.meetingZone(language)} ($upcomingMeetingsCount ${t(language, "Upcoming", "আসন্ন")})"
                    } else {
                        "${L10n.meetingZone(language)} (Google Meet)"
                    },
                    subtitle = t(
                        language,
                        "Join live Google Meet classes, webinars & seminars scheduled by faculty and admins",
                        "অধ্যাপক ও অ্যাডমিন পরিচালিত লাইভ গুগল মিট ক্লাস ও সেমিনারে যোগ দিন"
                    ),
                    icon = Icons.Filled.VideoCall,
                    accentColor = Color(0xFF0E7490),
                    tag = "home_portal_meeting_zone",
                    onClick = onOpenMeetingZone
                )
                PortalFeatureCard(
                    title = if (unreadDoubtsCount > 0) {
                        "${L10n.doubtZoneFull(language)} • $unreadDoubtsCount ${t(language, "New", "নতুন")}"
                    } else {
                        L10n.doubtZoneFull(language)
                    },
                    subtitle = t(
                        language,
                        "Private 1-on-1 academic chat & image doubt solving with 9 faculty advisors",
                        "৯ জন অধ্যাপকের সাথে ব্যক্তিগত ১-অন-১ চ্যাট ও ছবির মাধ্যমে প্রশ্নের উত্তর পান"
                    ),
                    icon = Icons.Filled.Forum,
                    accentColor = Color(0xFF1B4332),
                    tag = "home_portal_doubt_zone",
                    onClick = onOpenDoubtZone
                )
                PortalFeatureCard(
                    title = L10n.moneyManager(language),
                    subtitle = t(language, "Private INR (₹) mess, hostel, education, shared bills & savings goals", "ব্যক্তিগত মেস, হোস্টেল, পড়াশোনা ও সঞ্চয়ের হিসাব (₹)"),
                    icon = Icons.Filled.AccountBalanceWallet,
                    accentColor = Color(0xFF047857),
                    tag = "home_portal_money",
                    onClick = onOpenMoneyManager
                )
                PortalFeatureCard(
                    title = t(language, "Farmer Portal & Query Desk", "কৃষক পোর্টাল ও প্রশ্ন ডেস্ক"),
                    subtitle = t(language, "Crop diseases, IPM pest control, submit crop issues & track replies", "ফসলের রোগ-পোকা সমাধান, প্রশ্ন জমা ও স্ট্যাটাস ট্র্যাকিং"),
                    icon = Icons.Filled.Agriculture,
                    accentColor = Color(0xFF15803D),
                    tag = "home_portal_farmer",
                    onClick = onOpenFarmer
                )
                PortalFeatureCard(
                    title = L10n.agriCalculators(language),
                    subtitle = t(language, "Fertilizer (Urea/DAP/MOP), Seed Rate & Plant Population calculators", "সার, বীজ হার ও চারার সংখ্যা নির্ণায়ক ক্যালকুলেটর"),
                    icon = Icons.Filled.Calculate,
                    accentColor = MaterialTheme.colorScheme.secondary,
                    tag = "home_portal_tools",
                    onClick = onOpenTools
                )
                PortalFeatureCard(
                    title = L10n.aiAssistant(language),
                    subtitle = t(language, "Gemini AI agronomy Q&A + crop photo analysis in English & Bengali", "ইংরেজি ও বাংলায় এআই কৃষি পরামর্শ ও ফসলের ছবি বিশ্লেষণ"),
                    icon = Icons.Filled.AutoAwesome,
                    accentColor = Color(0xFF0F766E),
                    tag = "home_portal_ai",
                    onClick = onOpenAi
                )
                PortalFeatureCard(
                    title = t(language, "Career, Scholarships & Community", "ক্যারিয়ার, বৃত্তি ও কমিউনিটি"),
                    subtitle = t(language, "Govt/private agri jobs, ICAR exams, college groups & doubt solving", "সরকারি ও বেসরকারি কৃষি চাকরি, বৃত্তি ও শিক্ষার্থী ফোরাম"),
                    icon = Icons.Filled.WorkOutline,
                    accentColor = MaterialTheme.colorScheme.tertiary,
                    tag = "home_portal_career_community",
                    onClick = onOpenCareerCommunity
                )
            }
        }

        // About Us, Contact & Direct WhatsApp Support
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = t(language, "About Guru Ji Vision & Support", "গুরু জি ভিশন সম্পর্কে ও সহায়তা"),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = appSettings.aboutText,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${t(language, "Support Email", "ইমেইল")}: ${appSettings.supportEmail}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )

                    WhatsAppSupportButton(
                        onClick = {
                            openWhatsAppGroupInvite(
                                context = context,
                                inviteUrl = appSettings.whatsappGroupInviteUrl
                            )
                        },
                        label = "Join Our WhatsApp Support Group",
                        testTagName = "home_whatsapp_support_button",
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedButton(
                        onClick = onSignOut,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("home_sign_out_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Logout,
                            contentDescription = "Sign out",
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(L10n.signOut(language))
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(12.dp)) }
    }
}
