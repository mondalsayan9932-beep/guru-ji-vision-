package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Agriculture
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import com.example.R
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.attemptAutoSignIn
import com.example.core.onGoogleSignInClicked
import com.example.core.t
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.LanguageTogglePill
import com.example.ui.components.OFFICIAL_WHATSAPP_GROUP_INVITE_URL
import com.example.ui.components.WhatsAppSupportButton
import com.example.ui.components.openWhatsAppGroupInvite

@Composable
fun AuthScreen(
    language: AppLanguage,
    onLanguageChange: (AppLanguage) -> Unit,
    onAuthSuccess: () -> Unit,
    allowAutoSignIn: Boolean = true
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val credentialManager = remember(context) { CredentialManager.create(context) }

    var isLoading by remember { mutableStateOf(false) }
    var authError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(allowAutoSignIn) {
        if (allowAutoSignIn) {
            attemptAutoSignIn(
                context = context,
                credentialManager = credentialManager,
                onAuthSuccess = onAuthSuccess,
                onUnauthenticated = {},
                scope = scope
            )
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .windowInsetsPadding(WindowInsets.safeDrawing),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 600.dp)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // Top bar with brand icon & bilingual pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_guruji_logo_clean),
                        contentDescription = "Guru Ji Vision Emblem",
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Crop
                    )
                    Column {
                        Text(
                            text = L10n.brandName(language),
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = t(language, "India Agri-Edu Ecosystem", "ভারতীয় কৃষি ও শিক্ষা প্ল্যাটফর্ম"),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                LanguageTogglePill(language = language, onToggle = onLanguageChange)
            }

            // Hero Agricultural Artwork Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp)
                    .clip(MaterialTheme.shapes.large)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.img_hero_agri_banner_1795234984548),
                    contentDescription = "Sunlit Indian green paddy fields",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.08f),
                                    Color(0xFF0A2E18).copy(alpha = 0.86f)
                                )
                            )
                        )
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.95f)
                    ) {
                        Text(
                            text = t(language, "STUDENTS • FARMERS • EDUCATORS", "শিক্ষার্থী • কৃষক • শিক্ষক"),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Text(
                        text = t(
                            language,
                            "Modern Agriculture & B.Sc Education in One Unified Platform",
                            "আধুনিক কৃষি ও B.Sc কৃষি শিক্ষার একত্রিত ডিজিটাল প্ল্যাটফর্ম"
                        ),
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White
                    )
                }
            }

            // Sign-In Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.7f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = t(language, "One-Click Google Sign-In", "এক ক্লিকে Google লগইন"),
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = t(
                            language,
                            "Continue securely with your Google account — no OTP or long forms. Access B.Sc Agriculture notes, your private Student Money Manager (₹), Farmer Crop Support, and AI Crop Advisor.",
                            "কোনো OTP বা জটিল ফর্ম ছাড়াই Google অ্যাকাউন্ট দিয়ে নিরাপদে প্রবেশ করুন। B.Sc কৃষি নোটস, ব্যক্তিগত মানি ম্যানেজার (₹), কৃষক সহায়তা ও এআই কৃষি সহায়ক ব্যবহার করুন।"
                        ),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (authError != null) {
                        ErrorBannerCard(message = authError!!)
                    }

                    Button(
                        onClick = {
                            authError = null
                            isLoading = true
                            onGoogleSignInClicked(
                                context = context,
                                credentialManager = credentialManager,
                                onAuthSuccess = {
                                    isLoading = false
                                    onAuthSuccess()
                                },
                                onAuthError = { msg ->
                                    isLoading = false
                                    authError = msg
                                },
                                scope = scope,
                                onAuthCancelled = {
                                    isLoading = false
                                }
                            )
                        },
                        enabled = !isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .testTag("google_sign_in_button"),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = MaterialTheme.colorScheme.onPrimary,
                                strokeWidth = 2.5.dp
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(t(language, "Signing in...", "লগইন হচ্ছে..."))
                        } else {
                            Icon(
                                imageVector = Icons.Filled.Login,
                                contentDescription = "Sign in with Google",
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = L10n.signInWithGoogle(language),
                                style = MaterialTheme.typography.labelLarge
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.VerifiedUser,
                            contentDescription = "Protected by Firebase Security",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = t(
                                language,
                                "Strictly private Student Money Manager & secure Google Account session.",
                                "সম্পূর্ণ ব্যক্তিগত শিক্ষার্থী মানি ম্যানেজার ও নিরাপদ Google সেশন।"
                            ),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    WhatsAppSupportButton(
                        onClick = {
                            openWhatsAppGroupInvite(context, OFFICIAL_WHATSAPP_GROUP_INVITE_URL)
                        },
                        label = "Join Our WhatsApp Support Group",
                        testTagName = "auth_whatsapp_group_button",
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Ecosystem Pillars Preview
            Text(
                text = t(language, "Inside Guru Ji Vision", "গুরু জি ভিশনের মূল বৈশিষ্ট্য"),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground
            )

            val highlights = listOf(
                Triple(
                    Icons.Filled.School,
                    t(language, "B.Sc Agriculture Hub", "B.Sc কৃষি শিক্ষা হাব"),
                    t(language, "Semester 1–8 notes, PYQs, practicals & online MCQ exams.", "১ম–৮ম সেমিস্টার নোটস, PYQ, প্র্যাকটিক্যাল ও অনলাইন পরীক্ষা।")
                ),
                Triple(
                    Icons.Filled.AccountBalanceWallet,
                    t(language, "Private Student Money Manager (₹)", "শিক্ষার্থী মানি ম্যানেজার (₹)"),
                    t(language, "Track mess, hostel, shared bills, monthly budgets & savings.", "মেস, হোস্টেল, বই ও সঞ্চয়ের ব্যক্তিগত হিসাব রাখুন।")
                ),
                Triple(
                    Icons.Filled.Agriculture,
                    t(language, "Farmer Support & Crop Advisory", "কৃষক সহায়তা ও ফসল পরামর্শ"),
                    t(language, "Disease/pest IPM guides, crop photo scan & WhatsApp support.", "রোগ-পোকা দমন, ছবি বিশ্লেষণ ও সরাসরি হোয়াটসঅ্যাপ সহায়তা।")
                ),
                Triple(
                    Icons.Filled.Calculate,
                    t(language, "Precision Agri Calculators", "নির্ভুল কৃষি ক্যালকুলেটর"),
                    t(language, "NPK Urea/DAP/MOP, Seed Rate & Plant Population tools.", "সার (ইউরিয়া/DAP/MOP), বীজ হার ও চারার সংখ্যা হিসাব।")
                ),
                Triple(
                    Icons.Filled.AutoAwesome,
                    t(language, "Bilingual AI Agriculture Assistant", "দ্বিভাষিক এআই কৃষি সহায়ক"),
                    t(language, "Gemini-powered English & Bengali crop Q&A and image diagnosis.", "ইংরেজি ও বাংলায় তাৎক্ষণিক ফসল প্রশ্ন ও ছবি পরীক্ষা।")
                )
            )

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                highlights.forEach { (icon, title, desc) ->
                    EcosystemHighlightRow(icon = icon, title = title, description = desc)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun EcosystemHighlightRow(
    icon: ImageVector,
    title: String,
    description: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
