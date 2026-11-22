package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
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
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Agriculture
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.ui.components.LanguageTogglePill
import com.example.ui.components.rememberResponsiveMetrics

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingScreen(
    initialName: String,
    initialEmail: String,
    initialPhotoUrl: String = "",
    language: AppLanguage,
    onLanguageChange: (AppLanguage) -> Unit,
    busy: Boolean,
    onCompleteRegistration: (
        displayName: String,
        role: String,
        institutionOrVillage: String,
        district: String,
        semester: Long,
        language: String
    ) -> Unit
) {
    var displayName by remember { mutableStateOf(initialName) }
    var selectedRole by remember { mutableStateOf("STUDENT") }
    var institutionOrVillage by remember { mutableStateOf("") }
    var district by remember { mutableStateOf("") }
    var selectedSemester by remember { mutableLongStateOf(1L) }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .imePadding(),
        contentAlignment = Alignment.TopCenter
    ) {
        val metrics = rememberResponsiveMetrics(maxWidth)
        val useCompactLang = maxWidth < 380.dp

        Column(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 600.dp)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = metrics.horizontalPadding, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = L10n.brandName(language),
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.primary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                LanguageTogglePill(
                    language = language,
                    onToggle = onLanguageChange,
                    compact = useCompactLang
                )
            }

            // Google Account Summary Card (auto-fetched display name, email & profile photo)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (initialPhotoUrl.isNotBlank()) {
                        AsyncImage(
                            model = initialPhotoUrl,
                            contentDescription = "Google Profile Photo",
                            modifier = Modifier
                                .size(52.dp)
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Filled.AccountCircle,
                            contentDescription = "Google Account Avatar",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(52.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = displayName.ifBlank { t(language, "Google Account Connected", "Google অ্যাকাউন্ট যুক্ত হয়েছে") },
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = initialEmail,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Text(
                text = t(language, "Select Your Account Type", "আপনার অ্যাকাউন্টের ধরন নির্বাচন করুন"),
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = t(
                    language,
                    "Quick 1-step setup — pick Student or Farmer to start immediately.",
                    "দ্রুত ১-ধাপের সেটআপ — শুরু করতে শিক্ষার্থী অথবা কৃষক নির্বাচন করুন।"
                ),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Role Selection Cards
            if (metrics.isUltraCompact) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    RoleCard(
                        title = L10n.studentRole(language),
                        subtitle = t(language, "B.Sc Agri, Notes & Money Manager", "B.Sc কৃষি ও মানি ম্যানেজার"),
                        icon = Icons.Filled.School,
                        selected = selectedRole == "STUDENT",
                        tag = "role_select_student",
                        onClick = { selectedRole = "STUDENT" },
                        modifier = Modifier.fillMaxWidth()
                    )
                    RoleCard(
                        title = L10n.farmerRole(language),
                        subtitle = t(language, "Crop Care, Queries & Calculators", "ফসল পরামর্শ ও ক্যালকুলেটর"),
                        icon = Icons.Filled.Agriculture,
                        selected = selectedRole == "FARMER",
                        tag = "role_select_farmer",
                        onClick = { selectedRole = "FARMER" },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    RoleCard(
                        title = L10n.studentRole(language),
                        subtitle = t(language, "B.Sc Agri, Notes & Money Manager", "B.Sc কৃষি ও মানি ম্যানেজার"),
                        icon = Icons.Filled.School,
                        selected = selectedRole == "STUDENT",
                        tag = "role_select_student",
                        onClick = { selectedRole = "STUDENT" },
                        modifier = Modifier.weight(1f)
                    )
                    RoleCard(
                        title = L10n.farmerRole(language),
                        subtitle = t(language, "Crop Care, Queries & Calculators", "ফসল পরামর্শ ও ক্যালকুলেটর"),
                        icon = Icons.Filled.Agriculture,
                        selected = selectedRole == "FARMER",
                        tag = "role_select_farmer",
                        onClick = { selectedRole = "FARMER" },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            OutlinedTextField(
                value = displayName,
                onValueChange = { displayName = it },
                label = { Text(t(language, "Full Name", "পূর্ণ নাম")) },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("onboarding_name_input")
            )

            OutlinedTextField(
                value = institutionOrVillage,
                onValueChange = { institutionOrVillage = it },
                label = {
                    Text(
                        if (selectedRole == "STUDENT") {
                            t(language, "College / University (Optional)", "কলেজ / বিশ্ববিদ্যালয় (ঐচ্ছিক)")
                        } else {
                            t(language, "Village / Block (Optional)", "গ্রাম / ব্লক (ঐচ্ছিক)")
                        }
                    )
                },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("onboarding_institution_input")
            )

            OutlinedTextField(
                value = district,
                onValueChange = { district = it },
                label = { Text(t(language, "District & State (Optional)", "জেলা ও রাজ্য (ঐচ্ছিক)")) },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("onboarding_district_input")
            )

            if (selectedRole == "STUDENT") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = t(language, "Current B.Sc Agriculture Semester", "বর্তমান B.Sc কৃষি সেমিস্টার"),
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        (1L..8L).forEach { sem ->
                            FilterChip(
                                selected = selectedSemester == sem,
                                onClick = { selectedSemester = sem },
                                label = { Text("Sem $sem") },
                                modifier = Modifier.testTag("onboarding_sem_$sem")
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = {
                    onCompleteRegistration(
                        displayName,
                        selectedRole,
                        institutionOrVillage,
                        district,
                        if (selectedRole == "STUDENT") selectedSemester else 0L,
                        language.code
                    )
                },
                enabled = !busy && displayName.trim().isNotEmpty(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .testTag("complete_onboarding_button"),
                shape = RoundedCornerShape(14.dp)
            ) {
                if (busy) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = t(language, "Enter Guru Ji Vision", "গুরু জি ভিশনে প্রবেশ করুন"),
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            }
        }
    }
}

@Composable
private fun RoleCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    selected: Boolean,
    tag: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .minimumInteractiveComponentSize()
            .testTag(tag)
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer
            else MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(
            width = if (selected) 2.dp else 1.dp,
            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
        )
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(28.dp)
                )
                if (selected) {
                    Icon(
                        imageVector = Icons.Filled.CheckCircle,
                        contentDescription = "Selected",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
