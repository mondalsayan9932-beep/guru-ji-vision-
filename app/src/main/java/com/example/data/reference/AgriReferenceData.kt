package com.example.data.reference

import kotlin.math.max
import kotlin.math.roundToInt

enum class AreaUnit(val labelEn: String, val labelBn: String, val hectaresPerUnit: Double) {
    HECTARE("Hectare (ha)", "হেক্টর (ha)", 1.0),
    ACRE("Acre", "একর", 0.404686),
    BIGHA("Bigha (WB / 0.1338 ha)", "বিঘা (পশ্চিমবঙ্গ)", 0.13378)
}

data class CropPreset(
    val nameEn: String,
    val nameBn: String,
    val season: String,
    val soilPh: String,
    val npkPerHa: Triple<Double, Double, Double>, // N, P2O5, K2O kg/ha
    val spacingCm: Pair<Double, Double>, // Row x Plant cm
    val seedRateKgPerHa: String,
    val majorDiseases: List<String>,
    val majorPests: List<String>,
    val ipmGuidance: String
)

data class FertilizerResult(
    val areaHa: Double,
    val targetN: Double,
    val targetP: Double,
    val targetK: Double,
    val dapKg: Double,
    val ureaKg: Double,
    val mopKg: Double,
    val sspAlternativeKg: Double,
    val ureaWithSspKg: Double
)

data class SeedRateResult(
    val areaSqM: Double,
    val totalPlants: Long,
    val seedRateKg: Double
)

object AgriCalculators {
    /**
     * Standard ICAR agronomic NPK conversion:
     * DAP = 18% N, 46% P2O5 | Urea = 46% N | MOP = 60% K2O | SSP = 16% P2O5
     */
    fun calculateFertilizer(
        areaValue: Double,
        unit: AreaUnit,
        nPerHa: Double,
        pPerHa: Double,
        kPerHa: Double
    ): FertilizerResult {
        val areaHa = max(0.0, areaValue * unit.hectaresPerUnit)
        val reqN = max(0.0, nPerHa * areaHa)
        val reqP = max(0.0, pPerHa * areaHa)
        val reqK = max(0.0, kPerHa * areaHa)

        // Route 1: DAP + Urea + MOP
        val dapKg = if (reqP > 0.0) reqP / 0.46 else 0.0
        val nFromDap = dapKg * 0.18
        val remainingN = max(0.0, reqN - nFromDap)
        val ureaKg = remainingN / 0.46
        val mopKg = if (reqK > 0.0) reqK / 0.60 else 0.0

        // Route 2: SSP + Urea + MOP
        val sspKg = if (reqP > 0.0) reqP / 0.16 else 0.0
        val ureaWithSspKg = reqN / 0.46

        return FertilizerResult(
            areaHa = areaHa,
            targetN = reqN,
            targetP = reqP,
            targetK = reqK,
            dapKg = dapKg,
            ureaKg = ureaKg,
            mopKg = mopKg,
            sspAlternativeKg = sspKg,
            ureaWithSspKg = ureaWithSspKg
        )
    }

    /**
     * Standard Seed Rate Formula (kg):
     * Seed Rate (kg) = (Area in sq.m * TestWeight(g) * 100 * 100) / (RowSpacing(m) * PlantSpacing(m) * 1000 * 1000 * Germination% * Purity%)
     */
    fun calculateSeedRate(
        areaValue: Double,
        unit: AreaUnit,
        rowSpacingCm: Double,
        plantSpacingCm: Double,
        testWeightGramsPer1000: Double,
        germinationPercent: Double,
        purityPercent: Double
    ): SeedRateResult {
        val areaSqM = max(0.0, areaValue * unit.hectaresPerUnit * 10_000.0)
        val rowM = max(0.01, rowSpacingCm / 100.0)
        val plantM = max(0.01, plantSpacingCm / 100.0)
        val population = (areaSqM / (rowM * plantM)).roundToInt().toLong()

        val germFrac = (germinationPercent.coerceIn(1.0, 100.0)) / 100.0
        val purityFrac = (purityPercent.coerceIn(1.0, 100.0)) / 100.0
        val effectiveSeedsNeeded = population.toDouble() / (germFrac * purityFrac)
        val seedWeightGrams = (effectiveSeedsNeeded / 1000.0) * max(0.1, testWeightGramsPer1000)
        return SeedRateResult(
            areaSqM = areaSqM,
            totalPlants = population,
            seedRateKg = seedWeightGrams / 1000.0
        )
    }

    fun calculatePlantPopulation(
        areaValue: Double,
        unit: AreaUnit,
        rowSpacingCm: Double,
        plantSpacingCm: Double
    ): Long {
        val areaSqM = max(0.0, areaValue * unit.hectaresPerUnit * 10_000.0)
        val rowM = max(0.01, rowSpacingCm / 100.0)
        val plantM = max(0.01, plantSpacingCm / 100.0)
        return (areaSqM / (rowM * plantM)).roundToInt().toLong()
    }
}

object AgriKnowledgeBase {
    val crops: List<CropPreset> = listOf(
        CropPreset(
            nameEn = "Paddy / Rice (Aman & Boro)",
            nameBn = "ধান (আমন ও বোরো)",
            season = "Kharif (Jun–Nov) & Boro (Dec–May)",
            soilPh = "5.5 – 6.5 (Clayey loam)",
            npkPerHa = Triple(120.0, 60.0, 60.0),
            spacingCm = Pair(20.0, 15.0),
            seedRateKgPerHa = "30–40 kg/ha (Transplanted), 5–6 kg/ha (SRI)",
            majorDiseases = listOf("Rice Blast (Magnaporthe oryzae)", "Bacterial Leaf Blight (BLB)", "Sheath Blight"),
            majorPests = listOf("Yellow Stem Borer", "Brown Plant Hopper (BPH)", "Leaf Folder"),
            ipmGuidance = "Use resistant varieties, balanced nitrogen split doses, pheromone traps (5/ha) for Stem Borer, and alternate wetting & drying to curb BPH. Consult local KVK before spraying."
        ),
        CropPreset(
            nameEn = "Wheat",
            nameBn = "গম",
            season = "Rabi (Nov–Mar)",
            soilPh = "6.0 – 7.5 (Well-drained loam)",
            npkPerHa = Triple(120.0, 60.0, 40.0),
            spacingCm = Pair(22.5, 5.0),
            seedRateKgPerHa = "100 kg/ha (Timely), 125 kg/ha (Late)",
            majorDiseases = listOf("Yellow & Brown Rust", "Loose Smut", "Karnal Bunt"),
            majorPests = listOf("Aphids", "Termites", "Pink Stem Borer"),
            ipmGuidance = "Irrigate critically at CRI stage (21 DAS). Treat seeds with Trichoderma or recommended fungicide prior to sowing; avoid late heavy nitrogen top-dressing."
        ),
        CropPreset(
            nameEn = "Potato",
            nameBn = "আলু",
            season = "Rabi (Oct–Feb)",
            soilPh = "5.2 – 6.4 (Sandy loam)",
            npkPerHa = Triple(180.0, 100.0, 120.0),
            spacingCm = Pair(60.0, 20.0),
            seedRateKgPerHa = "2000–2500 kg/ha seed tubers",
            majorDiseases = listOf("Late Blight (Phytophthora infestans)", "Early Blight", "Black Scurf"),
            majorPests = listOf("Potato Tuber Moth", "Aphids (Virus vector)", "Cutworm"),
            ipmGuidance = "Use certified disease-free seed tubers, earth up properly at 30 DAP, monitor fog/cool humid spells for Late Blight preventive sprays per State Agriculture Dept advisory."
        ),
        CropPreset(
            nameEn = "Mustard / Rapeseed",
            nameBn = "সরিষা",
            season = "Rabi (Oct–Feb)",
            soilPh = "6.0 – 7.5 (Light loam)",
            npkPerHa = Triple(80.0, 40.0, 40.0),
            spacingCm = Pair(30.0, 10.0),
            seedRateKgPerHa = "4–5 kg/ha",
            majorDiseases = listOf("Alternaria Blight", "White Rust", "Downy Mildew"),
            majorPests = listOf("Mustard Aphid (Lipaphis erysimi)", "Painted Bug", "Sawfly"),
            ipmGuidance = "Timely October sowing escapes peak aphid build-up. Install yellow sticky traps, apply 20 kg Sulphur/ha for oil content, and conserve ladybird beetles."
        ),
        CropPreset(
            nameEn = "Tomato",
            nameBn = "টমেটো",
            season = "Rabi & Kharif (Year-round)",
            soilPh = "6.0 – 7.0 (Fertile loam)",
            npkPerHa = Triple(120.0, 80.0, 80.0),
            spacingCm = Pair(60.0, 45.0),
            seedRateKgPerHa = "350–400 g/ha (Open), 150 g/ha (Hybrid)",
            majorDiseases = listOf("Tomato Leaf Curl Virus (ToLCV)", "Early Blight", "Bacterial Wilt"),
            majorPests = listOf("Fruit Borer (Helicoverpa)", "Whitefly", "Leaf Miner"),
            ipmGuidance = "Raise seedlings under 40-mesh insect-proof nylon net, plant marigold as a trap crop (1:16 rows) for Fruit Borer, and use neem oil (Azadirachtin) for whiteflies."
        ),
        CropPreset(
            nameEn = "Jute",
            nameBn = "পাট",
            season = "Pre-Kharif (Mar–Jul)",
            soilPh = "5.8 – 7.0 (Alluvial loam)",
            npkPerHa = Triple(60.0, 30.0, 30.0),
            spacingCm = Pair(25.0, 7.0),
            seedRateKgPerHa = "5–6 kg/ha (Tossa / Corchorus olitorius)",
            majorDiseases = listOf("Stem Rot (Macrophomina)", "Root Rot", "Anthracnose"),
            majorPests = listOf("Jute Semilooper", "Bihar Hairy Caterpillar", "Yellow Mite"),
            ipmGuidance = "Ensure good drainage to prevent stem rot, hand-pick early egg masses of hairy caterpillar, and use improved microbial retting (CRIJAF Sona) for golden fibre grade."
        )
    )
}
