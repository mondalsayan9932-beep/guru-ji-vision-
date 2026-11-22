package com.example.ui.screens

import android.graphics.Bitmap
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.Agriculture
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.R
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.t
import com.example.data.model.AppSettings
import com.example.data.model.FarmerQuery
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.data.reference.AgriKnowledgeBase
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.WhatsAppSupportButton
import com.example.ui.components.decodeScaledBitmap
import com.example.ui.components.openWhatsAppGroupInvite
import com.example.ui.components.rememberResponsiveMetrics

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FarmerHubScreen(
    profile: UserProfile?,
    language: AppLanguage,
    appSettings: AppSettings,
    myQueriesState: UiState<List<FarmerQuery>>,
    busy: Boolean,
    onSubmitQuery: (
        farmerName: String,
        cropName: String,
        category: String,
        description: String,
        district: String,
        cropBitmap: Bitmap?,
        language: AppLanguage,
        onSuccess: () -> Unit
    ) -> Unit,
    onDeleteOpenQuery: (String) -> Unit
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) }

    var cropName by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("DISEASE") }
    var description by remember { mutableStateOf("") }
    var district by remember(profile?.district) { mutableStateOf(profile?.district.orEmpty()) }
    var pickedPhotoUri by remember { mutableStateOf<Uri?>(null) }
    var pickedBitmap by remember { mutableStateOf<Bitmap?>(null) }

    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        pickedPhotoUri = uri
        pickedBitmap = uri?.let { decodeScaledBitmap(context, it, maxDimPx = 960) }
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        val metrics = rememberResponsiveMetrics(maxWidth)

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text(t(language, "My Crop Queries", "আমার ফসল প্রশ্ন"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("farmer_tab_queries")
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text(t(language, "Crop & Pest Guide", "ফসল ও রোগ নির্দেশিকা"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("farmer_tab_guide")
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = metrics.contentMaxWidth),
            contentPadding = metrics.screenContentPadding,
            verticalArrangement = Arrangement.spacedBy(metrics.itemSpacing)
        ) {
            // Editorial Farmer Banner + Direct WhatsApp Support
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(MaterialTheme.shapes.large)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.img_farmer_support_art_1795235007622),
                        contentDescription = "Farmer Support Banner",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.matchParentSize()
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(
                                Brush.horizontalGradient(
                                    listOf(
                                        Color(0xFF0A2E18).copy(alpha = 0.88f),
                                        Color(0xFF0A2E18).copy(alpha = 0.28f)
                                    )
                                )
                            )
                    )
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 164.dp)
                            .padding(metrics.cardPadding),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = t(language, "Farmer Support Center", "কৃষক সহায়তা কেন্দ্র"),
                                style = MaterialTheme.typography.headlineSmall,
                                color = Color.White
                            )
                            Text(
                                text = t(
                                    language,
                                    "Private crop diagnosis queries, IPM guidance & direct WhatsApp helpline",
                                    "ফসলের রোগ-পোকা সমাধান, ব্যক্তিগত প্রশ্ন ও সরাসরি হোয়াটসঅ্যাপ সহায়তা"
                                ),
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        WhatsAppSupportButton(
                            onClick = {
                                openWhatsAppGroupInvite(
                                    context = context,
                                    inviteUrl = appSettings.whatsappGroupInviteUrl
                                )
                            },
                            label = "Join Our WhatsApp Support Group",
                            testTagName = "farmer_whatsapp_button",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            if (selectedTab == 0) {
                // Submit New Crop Query Form
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            SectionHeader(
                                title = t(language, "Submit a Crop Query", "নতুন ফসল প্রশ্ন জমা দিন"),
                                subtitle = t(
                                    language,
                                    "Visible only to you and verified Guru Ji Vision agronomists",
                                    "শুধুমাত্র আপনি এবং আমাদের কৃষি বিশেষজ্ঞরা এটি দেখতে পাবেন"
                                )
                            )

                            OutlinedTextField(
                                value = cropName,
                                onValueChange = { cropName = it },
                                label = { Text(t(language, "Crop Name (e.g. Aman Paddy, Potato)", "ফসলের নাম (যেমন: ধান, আলু)")) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth().testTag("farmer_crop_input")
                            )

                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("DISEASE", "PEST", "FERTILIZER", "SOIL", "WEATHER", "OTHER").forEach { cat ->
                                    FilterChip(
                                        selected = category == cat,
                                        onClick = { category = cat },
                                        label = { Text(cat) },
                                        modifier = Modifier.testTag("farmer_cat_$cat")
                                    )
                                }
                            }

                            OutlinedTextField(
                                value = district,
                                onValueChange = { district = it },
                                label = { Text(t(language, "District / Village", "জেলা / গ্রাম")) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text(t(language, "Describe symptoms (leaf spots, insects, yellowing...)", "ফসলের সমস্যার বিবরণ লিখুন")) },
                                minLines = 3,
                                modifier = Modifier.fillMaxWidth().testTag("farmer_desc_input")
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        photoPicker.launch(
                                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                        )
                                    },
                                    modifier = Modifier
                                        .weight(1f)
                                        .heightIn(min = 48.dp)
                                        .testTag("farmer_pick_photo_button")
                                ) {
                                    Icon(Icons.Filled.AddPhotoAlternate, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        text = if (pickedPhotoUri != null) t(language, "Change Photo", "ছবি বদলান")
                                        else t(language, "Attach Crop Photo (AI Pre-Scan)", "ফসলের ছবি যোগ করুন"),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                if (pickedPhotoUri != null) {
                                    AsyncImage(
                                        model = pickedPhotoUri,
                                        contentDescription = "Selected crop image",
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(RoundedCornerShape(10.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                }
                            }

                            Button(
                                onClick = {
                                    onSubmitQuery(
                                        profile?.displayName ?: "Farmer",
                                        cropName,
                                        category,
                                        description,
                                        district,
                                        pickedBitmap,
                                        language
                                    ) {
                                        cropName = ""
                                        description = ""
                                        pickedPhotoUri = null
                                        pickedBitmap = null
                                    }
                                },
                                enabled = !busy && cropName.trim().isNotEmpty() && description.trim().length >= 5,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                                    .testTag("farmer_submit_query_button")
                            ) {
                                if (busy) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(20.dp),
                                        color = MaterialTheme.colorScheme.onPrimary,
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Icon(Icons.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text(t(language, "Submit Query", "প্রশ্ন জমা দিন"))
                                }
                            }
                        }
                    }
                }

                // My Submitted Queries Status Tracker
                item {
                    SectionHeader(
                        title = t(language, "My Query Status Tracker", "আমার প্রশ্নের বর্তমান অবস্থা")
                    )
                }

                when (myQueriesState) {
                    UiState.Loading -> item { CircularProgressIndicator() }
                    is UiState.Error -> item { ErrorBannerCard(myQueriesState.message) }
                    is UiState.Success -> {
                        if (myQueriesState.data.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    title = t(language, "No Queries Submitted Yet", "এখনো কোনো প্রশ্ন জমা দেওয়া হয়নি"),
                                    description = t(
                                        language,
                                        "Submit a crop question above to receive expert agronomist replies and track OPEN / IN_REVIEW / RESOLVED status.",
                                        "উপরে ফসলের সমস্যা লিখুন ও জমা দিন; এখানে উত্তর এবং স্ট্যাটাস দেখতে পাবেন।"
                                    ),
                                    icon = Icons.Filled.Agriculture
                                )
                            }
                        } else {
                            items(myQueriesState.data, key = { it.id }) { q ->
                                val statusColor = when (q.status) {
                                    "RESOLVED" -> Color(0xFFD8F3DC) to Color(0xFF14532D)
                                    "IN_REVIEW" -> Color(0xFFFEF3C7) to Color(0xFF92400E)
                                    else -> Color(0xFFE0F2FE) to Color(0xFF075985)
                                }
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = MaterialTheme.shapes.medium,
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.55f))
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
                                            FlowRow(
                                                modifier = Modifier.weight(1f),
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Text(
                                                    text = q.cropName,
                                                    style = MaterialTheme.typography.titleMedium,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                StatusPill(q.status, statusColor.first, statusColor.second)
                                            }
                                            if (q.status == "OPEN") {
                                                IconButton(
                                                    onClick = { onDeleteOpenQuery(q.id) },
                                                    modifier = Modifier.testTag("farmer_del_query_${q.id}")
                                                ) {
                                                    Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete open query")
                                                }
                                            }
                                        }
                                        Text(
                                            text = "${q.category} • ${q.district.ifBlank { "India" }}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(q.description, style = MaterialTheme.typography.bodyMedium)

                                        if (q.imageSummary.isNotBlank()) {
                                            Card(
                                                colors = CardDefaults.cardColors(
                                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                                )
                                            ) {
                                                Text(
                                                    text = "AI Crop Photo Note: ${q.imageSummary}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    modifier = Modifier.padding(10.dp)
                                                )
                                            }
                                        }

                                        if (q.adminReply.isNotBlank()) {
                                            Card(
                                                colors = CardDefaults.cardColors(
                                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                                )
                                            ) {
                                                Column(modifier = Modifier.padding(12.dp)) {
                                                    Text(
                                                        text = t(language, "Agronomist Reply", "কৃষি বিশেষজ্ঞের পরামর্শ"),
                                                        style = MaterialTheme.typography.labelLarge,
                                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                                    )
                                                    Spacer(Modifier.height(4.dp))
                                                    Text(
                                                        text = q.adminReply,
                                                        style = MaterialTheme.typography.bodySmall,
                                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // TAB 1: Curated ICAR Crop, Disease, Pest & Fertilizer Guide
                item {
                    SectionHeader(
                        title = t(language, "Indian Crop Production & IPM Library", "ভারতীয় ফসল উৎপাদন ও রোগ-পোকা দমন"),
                        subtitle = t(language, "Standard ICAR reference parameters for field crops", "প্রধান ফসলের সার, রোগ ও সমন্বিত বালাই ব্যবস্থাপনা")
                    )
                }
                items(AgriKnowledgeBase.crops.chunked(metrics.gridColumns)) { cropRow ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        cropRow.forEach { crop ->
                            Card(
                                modifier = Modifier.weight(1f),
                                shape = MaterialTheme.shapes.medium,
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(metrics.cardPadding),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = if (language == AppLanguage.BN) "${crop.nameBn} (${crop.nameEn})" else crop.nameEn,
                                            style = MaterialTheme.typography.titleMedium,
                                            color = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Icon(Icons.Filled.BugReport, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                                    }
                                    Text(
                                        text = "Season: ${crop.season} | Soil pH: ${crop.soilPh}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = "Recommended NPK: ${crop.npkPerHa.first.toInt()}:${crop.npkPerHa.second.toInt()}:${crop.npkPerHa.third.toInt()} kg/ha | Seed Rate: ${crop.seedRateKgPerHa}",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Major Diseases: ${crop.majorDiseases.joinToString(", ")}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.error
                                    )
                                    Text(
                                        text = "Major Pests: ${crop.majorPests.joinToString(", ")}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.tertiary
                                    )
                                    Text(
                                        text = "IPM & Fertilizer Guidance: ${crop.ipmGuidance}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                        if (cropRow.size < metrics.gridColumns) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
    }
}
