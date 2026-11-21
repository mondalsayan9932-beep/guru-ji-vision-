package com.example

import com.example.core.AiGuruLocalStore
import com.example.core.AppLanguage
import com.example.core.StoredAiMessage
import com.example.data.model.StudyMaterial
import com.example.data.repository.AgriAiRepository
import com.example.data.repository.AiSourceLink
import com.example.data.repository.FreeWebSearchService
import com.example.data.repository.KnowledgeBaseEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class AiGuruUpgradeTest {

    @Test
    fun `sanitizeFreeModelName enforces free tier allowlist and blocks paid models`() {
        assertEquals(
            AgriAiRepository.MODEL_FLASH_FREE,
            AgriAiRepository.sanitizeFreeModelName("gemini-3.8-flash")
        )
        assertEquals(
            AgriAiRepository.MODEL_FLASH_LITE_FREE,
            AgriAiRepository.sanitizeFreeModelName("  gemini-3.5-flash-lite ")
        )
        // Paid, deprecated, or blank model requests must always fall back to free default
        assertEquals(
            AgriAiRepository.MODEL_FLASH_FREE,
            AgriAiRepository.sanitizeFreeModelName("gemini-4-argon")
        )
        assertEquals(
            AgriAiRepository.MODEL_FLASH_FREE,
            AgriAiRepository.sanitizeFreeModelName("gemini-1.5-flash")
        )
        assertEquals(
            AgriAiRepository.MODEL_FLASH_FREE,
            AgriAiRepository.sanitizeFreeModelName("")
        )
        assertEquals(
            AgriAiRepository.MODEL_FLASH_FREE,
            AgriAiRepository.sanitizeFreeModelName(null)
        )
    }

    @Test
    fun `quota and rate limit errors map to friendly bilingual retry-later messages`() {
        val quotaError = RuntimeException("HTTP 429 RESOURCE_EXHAUSTED: Free tier quota exceeded")
        val nestedRateLimit = IllegalStateException("Request failed", RuntimeException("Too many requests"))
        val normalError = IllegalStateException("Socket timeout")

        assertTrue(AgriAiRepository.isQuotaOrRateLimitError(quotaError))
        assertTrue(AgriAiRepository.isQuotaOrRateLimitError(nestedRateLimit))
        assertFalse(AgriAiRepository.isQuotaOrRateLimitError(normalError))

        val enMsg = AgriAiRepository.toUserFriendlyError(quotaError, AppLanguage.EN)
        val bnMsg = AgriAiRepository.toUserFriendlyError(quotaError, AppLanguage.BN)

        assertTrue(enMsg.contains("free usage quota", ignoreCase = true))
        assertTrue(enMsg.contains("No paid service", ignoreCase = true))
        assertTrue(bnMsg.contains("ফ্রি এআই কোটা"))
        assertTrue(bnMsg.contains("কোনো চার্জ কাটা হয়নি"))
    }

    @Test
    fun `knowledgeBaseEngine prioritizes verified Guru Ji Vision materials across agri subjects`() {
        val unverifiedNote = StudyMaterial(
            id = "mat_unverified",
            title = "Soil pH Basics",
            semester = 1,
            subject = "Soil Science",
            category = "NOTES",
            summary = "General note on soil pH and lime.",
            contentText = "Soil pH affects nutrient availability.",
            published = true,
            verifiedForAi = false
        )
        val verifiedSoilNote = StudyMaterial(
            id = "mat_verified_soil",
            title = "Soil pH & Gypsum Reclamation",
            semester = 1,
            subject = "Soil Science",
            category = "NOTES",
            summary = "ICAR verified notes on soil pH, CEC, acid lime, and alkali gypsum reclamation.",
            contentText = "Acidic soils (pH < 5.5) are reclaimed with agricultural lime (CaCO3). Alkali/sodic soils (pH > 8.5, ESP > 15%) are reclaimed using gypsum (CaSO4.2H2O).",
            resourceUrl = "https://icar.org.in/soil-ph-notes",
            published = true,
            verifiedForAi = true
        )
        val unpublishedDraft = StudyMaterial(
            id = "mat_draft",
            title = "Soil pH Draft",
            semester = 1,
            subject = "Soil Science",
            category = "NOTES",
            summary = "Unpublished draft on soil pH and gypsum.",
            contentText = "Soil pH gypsum draft",
            published = false,
            verifiedForAi = true
        )
        val verifiedEntomologyNote = StudyMaterial(
            id = "mat_verified_ent",
            title = "Integrated Pest Management (IPM) in Rice",
            semester = 4,
            subject = "Entomology",
            category = "PDF",
            summary = "IPM tactics for Yellow Stem Borer and Brown Plant Hopper (BPH).",
            contentText = "Use pheromone traps, Trichogramma egg parasitoids, and neem oil before chemical insecticides.",
            published = true,
            verifiedForAi = true
        )

        val soilMatches = KnowledgeBaseEngine.findRelevantMaterials(
            question = "How to reclaim alkali sodic soil using gypsum and manage soil pH?",
            materials = listOf(unverifiedNote, verifiedSoilNote, unpublishedDraft, verifiedEntomologyNote)
        )

        assertTrue(soilMatches.isNotEmpty())
        assertEquals("mat_verified_soil", soilMatches.first().material.id)
        assertFalse(soilMatches.any { it.material.id == "mat_draft" })

        val promptBlock = KnowledgeBaseEngine.buildPromptContextBlock(soilMatches)
        assertTrue(promptBlock.contains("VERIFIED GURU JI VISION KNOWLEDGE BASE"))
        assertTrue(promptBlock.contains("Soil pH & Gypsum Reclamation"))

        val links = KnowledgeBaseEngine.toSourceLinks(soilMatches)
        assertEquals(AiSourceLink.KIND_KNOWLEDGE_BASE, links.first().kind)
        assertEquals("https://icar.org.in/soil-ph-notes", links.first().url)

        val ipmMatches = KnowledgeBaseEngine.findRelevantMaterials(
            question = "Explain IPM for rice stem borer and BPH in Entomology",
            materials = listOf(unverifiedNote, verifiedSoilNote, verifiedEntomologyNote)
        )
        assertEquals("mat_verified_ent", ipmMatches.first().material.id)
    }

    @Test
    fun `freeWebSearchService parses Wikipedia JSON strips HTML and builds valid URLs`() {
        val sampleEnJson = """
            {
              "query": {
                "search": [
                  {
                    "title": "System of Rice Intensification",
                    "snippet": "The <span class=\"searchmatch\">System of Rice Intensification</span> (SRI) is an agro-ecological methodology &amp; farming practice."
                  },
                  {
                    "title": "Plant pathology",
                    "snippet": "<b>Plant pathology</b> is the scientific study of diseases in plants caused by pathogens."
                  }
                ]
              }
            }
        """.trimIndent()

        val enResults = FreeWebSearchService.parseWikipediaSearchJson(sampleEnJson, "en")
        assertEquals(2, enResults.size)
        assertEquals("System of Rice Intensification (Wikipedia)", enResults[0].title)
        assertEquals(
            "https://en.wikipedia.org/wiki/System_of_Rice_Intensification",
            enResults[0].url
        )
        assertFalse(enResults[0].snippet.contains("<span"))
        assertTrue(enResults[0].snippet.contains("& farming practice"))
        assertEquals(AiSourceLink.KIND_WEB_WIKIPEDIA, enResults[0].kind)

        val sampleBnJson = """
            {
              "query": {
                "search": [
                  {
                    "title": "ধান",
                    "snippet": "<span class=\"searchmatch\">ধান</span> বাংলাদেশের ও পশ্চিমবঙ্গের প্রধান খাদ্যশস্য।"
                  }
                ]
              }
            }
        """.trimIndent()

        val bnResults = FreeWebSearchService.parseWikipediaSearchJson(sampleBnJson, "bn")
        assertEquals(1, bnResults.size)
        assertTrue(bnResults[0].url.startsWith("https://bn.wikipedia.org/wiki/"))
        assertFalse(bnResults[0].snippet.contains("<span"))

        // Malformed JSON must fail gracefully with emptyList
        assertTrue(FreeWebSearchService.parseWikipediaSearchJson("{bad json", "en").isEmpty())
    }

    @Test
    fun `aiGuruLocalStore round trips chat history and source links cleanly`() {
        val messages = listOf(
            StoredAiMessage(
                id = "u_1",
                fromUser = true,
                text = "What is CRI stage in wheat?",
                studyMode = "EXAM_ANSWER",
                timestampMs = 1700000001L
            ),
            StoredAiMessage(
                id = "a_1",
                fromUser = false,
                text = "Crown Root Initiation (CRI) occurs 21 days after sowing in wheat.",
                studyMode = "EXAM_ANSWER",
                usedKnowledgeBase = true,
                sources = listOf(
                    AiSourceLink(
                        title = "Fundamentals of Agronomy (Sem 1 • Agronomy)",
                        url = "https://icar.org.in/agronomy",
                        snippet = "CRI stage is the most critical irrigation stage.",
                        kind = AiSourceLink.KIND_KNOWLEDGE_BASE
                    ),
                    AiSourceLink(
                        title = "Wheat (Wikipedia)",
                        url = "https://en.wikipedia.org/wiki/Wheat",
                        snippet = "Wheat is a grass widely cultivated for its seed.",
                        kind = AiSourceLink.KIND_WEB_WIKIPEDIA
                    )
                ),
                timestampMs = 1700000002L
            )
        )

        val encoded = AiGuruLocalStore.encodeMessagesJson(messages)
        val decoded = AiGuruLocalStore.decodeMessagesJson(encoded)

        assertEquals(2, decoded.size)
        assertEquals("u_1", decoded[0].id)
        assertTrue(decoded[0].fromUser)
        assertEquals("EXAM_ANSWER", decoded[0].studyMode)

        assertEquals("a_1", decoded[1].id)
        assertFalse(decoded[1].fromUser)
        assertTrue(decoded[1].usedKnowledgeBase)
        assertEquals(2, decoded[1].sources.size)
        assertEquals(AiSourceLink.KIND_KNOWLEDGE_BASE, decoded[1].sources[0].kind)
        assertEquals("https://en.wikipedia.org/wiki/Wheat", decoded[1].sources[1].url)

        // Malformed stored string must fail gracefully
        assertTrue(AiGuruLocalStore.decodeMessagesJson("corrupted").isEmpty())
    }
}
