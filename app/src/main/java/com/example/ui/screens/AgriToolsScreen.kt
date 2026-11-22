package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.core.AppLanguage
import com.example.core.t
import com.example.data.reference.AgriCalculators
import com.example.data.reference.AgriKnowledgeBase
import com.example.data.reference.AreaUnit
import com.example.ui.components.SectionHeader
import com.example.ui.components.rememberResponsiveMetrics
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AgriToolsScreen(language: AppLanguage) {
    var selectedTab by remember { mutableIntStateOf(0) }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        val metrics = rememberResponsiveMetrics(maxWidth)
        val isNarrow = maxWidth < 380.dp

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text(t(language, "Fertilizer", "সার হিসাব"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("tool_tab_fertilizer")
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text(t(language, "Seed Rate", "বীজ হার"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("tool_tab_seed")
            )
            Tab(
                selected = selectedTab == 2,
                onClick = { selectedTab = 2 },
                text = { Text(t(language, "Population", "চারার সংখ্যা"), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                modifier = Modifier.testTag("tool_tab_population")
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 860.dp),
            contentPadding = metrics.screenContentPadding,
            verticalArrangement = Arrangement.spacedBy(metrics.itemSpacing)
        ) {
            when (selectedTab) {
                0 -> item { FertilizerCalculatorCard(language, isNarrow) }
                1 -> item { SeedRateCalculatorCard(language, isNarrow) }
                2 -> item { PlantPopulationCalculatorCard(language) }
            }
        }
    }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FertilizerCalculatorCard(language: AppLanguage, isNarrow: Boolean = false) {
    var selectedUnit by remember { mutableStateOf(AreaUnit.BIGHA) }
    var areaInput by remember { mutableStateOf("1") }
    var nInput by remember { mutableStateOf("120") }
    var pInput by remember { mutableStateOf("60") }
    var kInput by remember { mutableStateOf("60") }

    val result = AgriCalculators.calculateFertilizer(
        areaValue = areaInput.toDoubleOrNull() ?: 0.0,
        unit = selectedUnit,
        nPerHa = nInput.toDoubleOrNull() ?: 0.0,
        pPerHa = pInput.toDoubleOrNull() ?: 0.0,
        kPerHa = kInput.toDoubleOrNull() ?: 0.0
    )

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(
            title = t(language, "NPK Fertilizer Calculator", "NPK সার ক্যালকুলেটর"),
            subtitle = t(
                language,
                "Converts N-P2O5-K2O dose into Urea (46%), DAP (18:46), SSP (16%) & MOP (60%)",
                "ফসলের জমির জন্য ইউরিয়া, ডিএপি, এসএসপি ও পটাশের সঠিক পরিমাণ"
            )
        )

        // Quick Crop Presets
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            AgriKnowledgeBase.crops.forEach { crop ->
                FilterChip(
                    selected = nInput == crop.npkPerHa.first.toInt().toString() &&
                        pInput == crop.npkPerHa.second.toInt().toString() &&
                        kInput == crop.npkPerHa.third.toInt().toString(),
                    onClick = {
                        nInput = crop.npkPerHa.first.toInt().toString()
                        pInput = crop.npkPerHa.second.toInt().toString()
                        kInput = crop.npkPerHa.third.toInt().toString()
                    },
                    label = { Text(if (language == AppLanguage.BN) crop.nameBn else crop.nameEn.substringBefore(" (")) }
                )
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AreaUnit.entries.forEach { unit ->
                        FilterChip(
                            selected = selectedUnit == unit,
                            onClick = { selectedUnit = unit },
                            label = { Text(if (language == AppLanguage.BN) unit.labelBn else unit.labelEn) },
                            modifier = Modifier.testTag("fert_unit_${unit.name}")
                        )
                    }
                }
                OutlinedTextField(
                    value = areaInput,
                    onValueChange = { areaInput = it },
                    label = { Text(t(language, "Land Area", "জমির পরিমাণ")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("fert_area_input")
                )
                if (isNarrow) {
                    OutlinedTextField(
                        value = nInput,
                        onValueChange = { nInput = it },
                        label = { Text("N (kg/ha)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = pInput,
                            onValueChange = { pInput = it },
                            label = { Text("P2O5 (kg/ha)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = kInput,
                            onValueChange = { kInput = it },
                            label = { Text("K2O (kg/ha)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                } else {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = nInput,
                            onValueChange = { nInput = it },
                            label = { Text("N (kg/ha)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = pInput,
                            onValueChange = { pInput = it },
                            label = { Text("P2O5") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = kInput,
                            onValueChange = { kInput = it },
                            label = { Text("K2O") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // Result Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.large,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = t(language, "Option A: DAP + Urea + MOP", "বিকল্প ১: ডিএপি + ইউরিয়া + পটাশ (MOP)"),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                ResultLine("DAP (18-46-0)", "${fmt1(result.dapKg)} kg (${fmt2(result.dapKg / 50.0)} bags)")
                ResultLine("Urea (46% N)", "${fmt1(result.ureaKg)} kg (${fmt2(result.ureaKg / 50.0)} bags)")
                ResultLine("MOP (60% K2O)", "${fmt1(result.mopKg)} kg (${fmt2(result.mopKg / 50.0)} bags)")
                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                Text(
                    text = t(language, "Option B: SSP + Urea + MOP", "বিকল্প ২: সিঙ্গেল সুপার ফসফেট (SSP) + ইউরিয়া + MOP"),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                ResultLine("SSP (16% P2O5)", "${fmt1(result.sspAlternativeKg)} kg (${fmt2(result.sspAlternativeKg / 50.0)} bags)")
                ResultLine("Urea (46% N)", "${fmt1(result.ureaWithSspKg)} kg")
                ResultLine("MOP (60% K2O)", "${fmt1(result.mopKg)} kg")
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SeedRateCalculatorCard(language: AppLanguage, isNarrow: Boolean = false) {
    var selectedUnit by remember { mutableStateOf(AreaUnit.HECTARE) }
    var areaInput by remember { mutableStateOf("1") }
    var rowCm by remember { mutableStateOf("20") }
    var plantCm by remember { mutableStateOf("15") }
    var testWeight by remember { mutableStateOf("25") }
    var germination by remember { mutableStateOf("85") }
    var purity by remember { mutableStateOf("98") }

    val res = AgriCalculators.calculateSeedRate(
        areaValue = areaInput.toDoubleOrNull() ?: 0.0,
        unit = selectedUnit,
        rowSpacingCm = rowCm.toDoubleOrNull() ?: 20.0,
        plantSpacingCm = plantCm.toDoubleOrNull() ?: 15.0,
        testWeightGramsPer1000 = testWeight.toDoubleOrNull() ?: 25.0,
        germinationPercent = germination.toDoubleOrNull() ?: 85.0,
        purityPercent = purity.toDoubleOrNull() ?: 98.0
    )

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(
            title = t(language, "Seed Rate Calculator", "বীজের হার ক্যালকুলেটর"),
            subtitle = t(language, "Exact seed weight using spacing, 1000-seed test weight, germination & purity %", "রোপণ দূরত্ব ও অঙ্কুরোদগম হার অনুযায়ী সঠিক বীজের পরিমাণ")
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AreaUnit.entries.forEach { unit ->
                        FilterChip(
                            selected = selectedUnit == unit,
                            onClick = { selectedUnit = unit },
                            label = { Text(if (language == AppLanguage.BN) unit.labelBn else unit.labelEn) }
                        )
                    }
                }
                OutlinedTextField(
                    value = areaInput,
                    onValueChange = { areaInput = it },
                    label = { Text(t(language, "Area", "জমির পরিমাণ")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = rowCm,
                        onValueChange = { rowCm = it },
                        label = { Text("Row (cm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = plantCm,
                        onValueChange = { plantCm = it },
                        label = { Text("Plant (cm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
                if (isNarrow) {
                    OutlinedTextField(
                        value = testWeight,
                        onValueChange = { testWeight = it },
                        label = { Text("1000-Seed Test Weight (g)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = germination,
                            onValueChange = { germination = it },
                            label = { Text("Germ %") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = purity,
                            onValueChange = { purity = it },
                            label = { Text("Purity %") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                } else {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = testWeight,
                            onValueChange = { testWeight = it },
                            label = { Text("1000-Seed (g)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = germination,
                            onValueChange = { germination = it },
                            label = { Text("Germ %") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = purity,
                            onValueChange = { purity = it },
                            label = { Text("Purity %") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.large,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ResultLine(t(language, "Estimated Seed Required", "প্রয়োজনীয় বীজের পরিমাণ"), "${fmt2(res.seedRateKg)} kg")
                ResultLine(t(language, "Target Plant Stand", "মোট গাছের সংখ্যা"), "${res.totalPlants} plants")
                ResultLine(t(language, "Area Covered", "মোট ক্ষেত্রফল"), "${fmt1(res.areaSqM)} sq.m")
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun PlantPopulationCalculatorCard(language: AppLanguage) {
    var selectedUnit by remember { mutableStateOf(AreaUnit.ACRE) }
    var areaInput by remember { mutableStateOf("1") }
    var rowCm by remember { mutableStateOf("60") }
    var plantCm by remember { mutableStateOf("20") }

    val pop = AgriCalculators.calculatePlantPopulation(
        areaValue = areaInput.toDoubleOrNull() ?: 0.0,
        unit = selectedUnit,
        rowSpacingCm = rowCm.toDoubleOrNull() ?: 60.0,
        plantSpacingCm = plantCm.toDoubleOrNull() ?: 20.0
    )

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(
            title = t(language, "Plant Population Calculator", "চারার সংখ্যা ক্যালকুলেটর"),
            subtitle = t(language, "Calculate exact plant stand per Hectare, Acre, or Bigha", "হেক্টর, একর বা বিঘা প্রতি সঠিক চারার সংখ্যা")
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AreaUnit.entries.forEach { unit ->
                        FilterChip(
                            selected = selectedUnit == unit,
                            onClick = { selectedUnit = unit },
                            label = { Text(if (language == AppLanguage.BN) unit.labelBn else unit.labelEn) }
                        )
                    }
                }
                OutlinedTextField(
                    value = areaInput,
                    onValueChange = { areaInput = it },
                    label = { Text(t(language, "Land Area", "জমির পরিমাণ")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = rowCm,
                        onValueChange = { rowCm = it },
                        label = { Text("Row Spacing (cm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = plantCm,
                        onValueChange = { plantCm = it },
                        label = { Text("Plant Spacing (cm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.large,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = t(language, "Total Plant Population", "মোট চারার সংখ্যা"),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = String.format(Locale.US, "%,d", pop),
                    style = MaterialTheme.typography.displaySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun ResultLine(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
            modifier = Modifier.weight(1f)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

private fun fmt1(v: Double): String = String.format(Locale.US, "%.1f", v)
private fun fmt2(v: Double): String = String.format(Locale.US, "%.2f", v)
