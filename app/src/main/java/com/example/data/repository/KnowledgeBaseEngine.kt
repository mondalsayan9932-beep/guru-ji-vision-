package com.example.data.repository

import com.example.data.model.StudyMaterial

data class KnowledgeBaseMatch(
    val material: StudyMaterial,
    val score: Int,
    val excerpt: String
)

/**
 * Pure-Kotlin retrieval engine that prioritizes verified Guru Ji Vision study materials
 * (Admin-uploaded PDFs, lecture notes, practical manuals, and summaries) when AI Guru
 * answers educational and agriculture questions.
 */
object KnowledgeBaseEngine {

    private val stopWords = setOf(
        "the", "and", "for", "with", "that", "this", "what", "when", "where", "which",
        "from", "into", "about", "explain", "write", "give", "tell", "how", "why",
        "are", "was", "were", "can", "could", "should", "would", "please", "notes",
        "note", "answer", "exam", "short", "long", "summary", "simple", "in", "of", "to", "on", "is"
    )

    private val subjectAliases: Map<String, List<String>> = mapOf(
        "agronomy" to listOf("tillage", "tilth", "crop", "sowing", "irrigation", "cri", "wheat", "paddy", "rice", "weed", "cropping", "yield"),
        "soil science" to listOf("soil", "ph", "cec", "cation", "clay", "humus", "gypsum", "lime", "saline", "sodic", "alkali", "organic", "nitrogen", "phosphorus", "potassium", "npk", "urea", "dap", "mop"),
        "botany" to listOf("botany", "plant", "tissue", "culture", "photosynthesis", "xylem", "phloem", "cell", "mitosis", "meiosis", "flower", "seed", "germination", "morphology", "anatomy"),
        "genetics" to listOf("genetics", "mendel", "gene", "allele", "chromosome", "dna", "rna", "hybrid", "breeding", "heterosis", "mutation", "linkage", "epistasis"),
        "plant pathology" to listOf("pathology", "disease", "fungus", "fungal", "blight", "blast", "rust", "smut", "wilt", "mosaic", "virus", "bacteria", "pathogen", "bordeaux", "tricyclazole"),
        "entomology" to listOf("entomology", "insect", "pest", "ipm", "borer", "aphid", "hopper", "bph", "caterpillar", "larva", "pheromone", "neem", "pesticide", "predator"),
        "extension" to listOf("extension", "rural", "kvk", "farmer", "adoption", "diffusion", "pra", "communication", "training")
    )

    fun tokenize(text: String): Set<String> {
        return text.lowercase()
            .split(Regex("[^\\p{L}\\p{N}]+"))
            .asSequence()
            .map { it.trim() }
            .filter { it.length >= 2 && it !in stopWords }
            .toSet()
    }

    /**
     * Ranks published Guru Ji Vision study materials by relevance to [question], giving
     * strong priority to verified Guru Ji Vision notes (`verifiedForAi == true`) and
     * materials containing rich extracted `contentText`.
     */
    fun findRelevantMaterials(
        question: String,
        materials: List<StudyMaterial>,
        maxMatches: Int = 3
    ): List<KnowledgeBaseMatch> {
        if (question.isBlank() || materials.isEmpty()) return emptyList()

        val qLower = question.lowercase()
        val qTokens = tokenize(question)
        if (qTokens.isEmpty()) return emptyList()

        // Expand domain tokens via agricultural subject aliases
        val inferredSubjects = subjectAliases.entries
            .filter { (_, keywords) -> keywords.any { kw -> kw in qTokens || qLower.contains(kw) } }
            .map { it.key }

        val ranked = materials
            .filter { it.published }
            .mapNotNull { mat ->
                val titleLower = mat.title.lowercase()
                val subjectLower = mat.subject.lowercase()
                val summaryLower = mat.summary.lowercase()
                val contentLower = mat.contentText.lowercase()

                var score = 0

                // Direct token overlap scoring
                for (token in qTokens) {
                    if (titleLower.contains(token)) score += 6
                    if (subjectLower.contains(token)) score += 5
                    if (summaryLower.contains(token)) score += 3
                    if (contentLower.contains(token)) score += 4
                }

                // Domain alias match bonus
                if (inferredSubjects.any { subj -> subjectLower.contains(subj) || titleLower.contains(subj) }) {
                    score += 5
                }

                // Verified Guru Ji Vision Knowledge Base priority boost (only if there is an actual match)
                if (score > 0 && mat.verifiedForAi) {
                    score += 4
                }
                if (score > 0 && mat.contentText.isNotBlank()) {
                    score += 2
                }

                if (score < 5) {
                    null
                } else {
                    val excerpt = buildBestExcerpt(mat, qTokens)
                    KnowledgeBaseMatch(material = mat, score = score, excerpt = excerpt)
                }
            }
            .sortedByDescending { it.score }
            .take(maxMatches)

        return ranked
    }

    private fun buildBestExcerpt(material: StudyMaterial, qTokens: Set<String>): String {
        val body = material.contentText.trim()
        if (body.isBlank()) {
            return material.summary.trim().take(800)
        }
        // Pick the most relevant paragraphs/sentences from contentText up to ~1,400 chars
        val chunks = body.split(Regex("\\n+")).map { it.trim() }.filter { it.isNotBlank() }
        if (chunks.size <= 2) {
            return "${material.summary.trim()}\n$body".trim().take(1500)
        }
        val scoredChunks = chunks.mapIndexed { idx, para ->
            val pLower = para.lowercase()
            val hits = qTokens.count { pLower.contains(it) }
            Triple(idx, hits, para)
        }.sortedWith(compareByDescending<Triple<Int, Int, String>> { it.second }.thenBy { it.first })

        val sb = StringBuilder()
        if (material.summary.isNotBlank()) {
            sb.append(material.summary.trim()).append("\n")
        }
        for ((_, _, para) in scoredChunks) {
            if (sb.length + para.length + 2 > 1500) break
            sb.append(para).append("\n")
        }
        return sb.toString().trim().take(1500)
    }

    fun buildPromptContextBlock(matches: List<KnowledgeBaseMatch>): String {
        if (matches.isEmpty()) return ""
        val sb = StringBuilder()
        sb.append("=== VERIFIED GURU JI VISION KNOWLEDGE BASE (GIVE PRIORITY TO THESE SOURCES) ===\n")
        matches.forEachIndexed { idx, match ->
            val m = match.material
            sb.append("[KB-${idx + 1}] Title: ${m.title} | Subject: ${m.subject} (Sem ${m.semester}, ${m.category})\n")
            sb.append("Content: ${match.excerpt}\n\n")
        }
        sb.append("Instruction: Give top priority to the verified Guru Ji Vision study materials above when answering, and explicitly mention their title(s) when relevant.\n")
        return sb.toString()
    }

    fun toSourceLinks(matches: List<KnowledgeBaseMatch>): List<AiSourceLink> {
        return matches.map { match ->
            val m = match.material
            AiSourceLink(
                title = "${m.title} (Sem ${m.semester} • ${m.subject})",
                url = m.resourceUrl.trim(),
                snippet = m.summary.trim().take(180),
                kind = AiSourceLink.KIND_KNOWLEDGE_BASE
            )
        }
    }
}
