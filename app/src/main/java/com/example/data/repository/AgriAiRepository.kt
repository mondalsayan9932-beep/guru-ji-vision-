package com.example.data.repository

import android.graphics.Bitmap
import android.util.Log
import com.example.core.AppLanguage
import com.google.firebase.Firebase
import com.google.firebase.ai.GenerativeModel
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.content
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withTimeout

private const val AI_TAG = "AgriAiRepository"
private const val AI_TIMEOUT_MS = 60_000L

enum class AiStudyMode(
    val code: String,
    val labelEn: String,
    val labelBn: String,
    val promptDirective: String
) {
    GENERAL(
        code = "GENERAL",
        labelEn = "Study & GK",
        labelBn = "পড়াশোনা ও GK",
        promptDirective = "Give a clear, accurate, well-structured educational answer suitable for students, farmers, and general learners."
    ),
    EXAM_ANSWER(
        code = "EXAM_ANSWER",
        labelEn = "Exam Answer",
        labelBn = "পরীক্ষার উত্তর",
        promptDirective = "Format the answer as a high-scoring university/ICAR exam answer: 1) Clear Definition, 2) Key Points / Classification / Mechanism, 3) Agricultural Significance or Example, 4) Brief Conclusion."
    ),
    NOTES_SUMMARY(
        code = "NOTES_SUMMARY",
        labelEn = "Notes & Summary",
        labelBn = "নোটস ও সারাংশ",
        promptDirective = "Provide crisp revision notes with bullet points, key scientific terms, important values/formulas, and a 3-point Quick Revision Box."
    ),
    SIMPLE_EXPLAIN(
        code = "SIMPLE_EXPLAIN",
        labelEn = "Simple Explain",
        labelBn = "সহজ ব্যাখ্যা",
        promptDirective = "Explain this difficult concept in very simple, everyday language with a relatable Indian agriculture or daily-life analogy so any beginner understands immediately."
    )
}

data class AiConnectionTestResult(
    val modelName: String,
    val latencyMs: Long,
    val replyPreview: String
)

/**
 * AI Guru repository powered exclusively by Firebase AI Logic (Google Gemini API Free Usage Tier).
 *
 * Security & Zero-Charge Guardrails:
 * - Zero API keys in frontend code or APK (authenticated via Firebase App Check).
 * - Strictly restricted to FREE-TIER Gemini models (`gemini-3.8-flash` and `gemini-3.5-flash-lite`).
 * - Never auto-switches to paid/billing-required models or paid Google Search APIs.
 * - Maps quota-exhausted (HTTP 429 / RESOURCE_EXHAUSTED) errors to friendly bilingual notices.
 */
class AgriAiRepository(
    private val telemetryRepo: TelemetryRepository? = null
) {

    companion object {
        const val MODEL_FLASH_FREE = "gemini-3.8-flash"
        const val MODEL_FLASH_LITE_FREE = "gemini-3.5-flash-lite"

        /**
         * Strictly enforced allowlist of Gemini models that require NO billing (Free Usage Tier).
         * Billing-required models (e.g. gemini-4-argon, image generation) are intentionally excluded.
         */
        val FREE_TIER_MODELS: Set<String> = setOf(
            MODEL_FLASH_FREE,
            MODEL_FLASH_LITE_FREE
        )

        fun sanitizeFreeModelName(requested: String?): String {
            val cleaned = requested?.trim().orEmpty()
            return if (cleaned in FREE_TIER_MODELS) cleaned else MODEL_FLASH_FREE
        }

        fun isQuotaOrRateLimitError(throwable: Throwable): Boolean {
            val msg = buildString {
                var cur: Throwable? = throwable
                while (cur != null) {
                    append(cur.javaClass.simpleName).append(' ')
                    append(cur.message.orEmpty()).append(' ')
                    cur = cur.cause
                }
            }.lowercase()
            return msg.contains("429") ||
                msg.contains("quota") ||
                msg.contains("resource_exhausted") ||
                msg.contains("resource exhausted") ||
                msg.contains("rate limit") ||
                msg.contains("too many requests") ||
                msg.contains("overloaded")
        }

        fun toUserFriendlyError(throwable: Throwable, language: AppLanguage): String {
            if (isQuotaOrRateLimitError(throwable)) {
                return if (language == AppLanguage.BN) {
                    "ফ্রি এআই কোটা সাময়িকভাবে পূর্ণ হয়েছে। কোনো চার্জ কাটা হয়নি — অনুগ্রহ করে কয়েক মিনিট পর আবার চেষ্টা করুন।"
                } else {
                    "AI Guru's free usage quota is temporarily full. No paid service was triggered — please try again in a few minutes."
                }
            }
            val rawMsg = throwable.localizedMessage.orEmpty()
            if (rawMsg.contains("403") || rawMsg.contains("App Check", ignoreCase = true)) {
                return if (language == AppLanguage.BN) {
                    "AI Guru সংযোগ যাচাই করা যাচ্ছে না (App Check / নেটওয়ার্ক)। অনুগ্রহ করে ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।"
                } else {
                    "Unable to verify AI Guru connection (App Check / network). Please check your internet connection or ask Admin to run Connection Test."
                }
            }
            return rawMsg.ifBlank {
                if (language == AppLanguage.BN) {
                    "AI Guru উত্তর দিতে পারেনি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
                } else {
                    "AI Guru could not respond right now. Please check your connection and try again."
                }
            }
        }
    }

    private val systemPromptText: String = """
        You are "AI Guru", the official Free Educational, General Knowledge, and Indian Agriculture AI Assistant inside the Guru Ji Vision application.
        - Serve agriculture students (B.Sc Agriculture / M.Sc / ICAR aspirants), farmers, teachers, and general learners.
        - Support BOTH Bengali (বাংলা) and English fluently. If the user writes in Bengali or Bengali mode is active, answer clearly in natural Bengali (keeping scientific/Latin names in brackets where helpful); otherwise answer in clear, accessible English.
        - Core Academic & Agricultural Expertise: Agriculture, Botany, Agronomy, Genetics & Plant Breeding, Soil Science, Plant Pathology, Entomology, Agricultural Extension, Horticulture, Crop Physiology, Plant Tissue Culture, IPR, and General Knowledge / Science.
        - Pedagogical Style: Explain difficult topics in simple, easy-to-remember language. Help students prepare structured exam answers, concise notes, and summaries.
        - KNOWLEDGE BASE PRIORITY: When "VERIFIED GURU JI VISION KNOWLEDGE BASE" excerpts are supplied in the prompt, prioritize those verified materials first and reference their title(s) clearly.
        - FREE WEB SOURCES: When "FREE WIKIPEDIA REFERENCE" snippets are supplied, use them accurately as supporting context without fabricating extra links.
        - FARMING SAFETY RULE: Never recommend banned or highly hazardous pesticides. Whenever pesticide or chemical fertilizer dosages are discussed for farming, include a brief reminder to confirm exact dosages with the nearest Krishi Vigyan Kendra (KVK) or local Agriculture Development Officer (ADO).
        - Keep formatting clean with headings and bullet points optimized for mobile screens.
    """.trimIndent()

    // Lazy cached Free-Tier models keyed strictly by sanitized free model name
    private val modelCache = mutableMapOf<String, GenerativeModel>()

    private fun getFreeModel(requestedModelName: String): GenerativeModel {
        val safeName = sanitizeFreeModelName(requestedModelName)
        return synchronized(modelCache) {
            modelCache.getOrPut(safeName) {
                Firebase.ai.generativeModel(
                    modelName = safeName,
                    systemInstruction = content { text(systemPromptText) }
                )
            }
        }
    }

    fun askAssistantStream(
        question: String,
        bitmap: Bitmap? = null,
        language: AppLanguage = AppLanguage.EN,
        modelName: String = MODEL_FLASH_FREE,
        studyMode: AiStudyMode = AiStudyMode.GENERAL,
        knowledgeBaseContext: String = "",
        webSearchSources: List<AiSourceLink> = emptyList(),
        recentHistory: List<Pair<Boolean, String>> = emptyList()
    ): Flow<String> = flow {
        val safeModelName = sanitizeFreeModelName(modelName)
        val model = getFreeModel(safeModelName)
        val startMs = System.currentTimeMillis()

        val langHint = if (language == AppLanguage.BN) {
            "Language: Respond clearly in Bengali (বাংলা). Include key English scientific terms in parentheses where useful."
        } else {
            "Language: Respond clearly in English (or Bengali if the user wrote their question in Bengali)."
        }

        val webBlock = if (webSearchSources.isNotEmpty()) {
            buildString {
                append("=== FREE WIKIPEDIA REFERENCE CONTEXT (OPTIONAL SUPPLEMENT) ===\n")
                webSearchSources.forEachIndexed { idx, src ->
                    append("[Web-${idx + 1}] ${src.title}: ${src.snippet}\nURL: ${src.url}\n")
                }
                append("\n")
            }
        } else ""

        val historyBlock = if (recentHistory.isNotEmpty()) {
            buildString {
                append("=== RECENT CONVERSATION CONTEXT ===\n")
                recentHistory.takeLast(6).forEach { (isUser, text) ->
                    val speaker = if (isUser) "Student/User" else "AI Guru"
                    append("$speaker: ${text.take(450)}\n")
                }
                append("\n")
            }
        } else ""

        val fullPrompt = buildString {
            append(langHint).append("\n")
            append("Mode Directive: ${studyMode.promptDirective}\n\n")
            if (knowledgeBaseContext.isNotBlank()) {
                append(knowledgeBaseContext).append("\n")
            }
            if (webBlock.isNotBlank()) {
                append(webBlock)
            }
            if (historyBlock.isNotBlank()) {
                append(historyBlock)
            }
            append("User Question: $question")
        }

        val inputContent = content {
            if (bitmap != null) {
                image(bitmap)
            }
            text(fullPrompt)
        }

        val accumulated = StringBuilder()
        var reportedPromptTokens = 0L
        var reportedOutputTokens = 0L
        try {
            withTimeout(AI_TIMEOUT_MS) {
                model.generateContentStream(inputContent).collect { chunk ->
                    chunk.usageMetadata?.let { meta ->
                        val pCount = meta.promptTokenCount
                        val cCount = meta.candidatesTokenCount ?: 0
                        if (pCount > 0) reportedPromptTokens = pCount.toLong()
                        if (cCount > 0) reportedOutputTokens = cCount.toLong()
                    }
                    val chunkText = chunk.text.orEmpty()
                    if (chunkText.isNotEmpty()) {
                        accumulated.append(chunkText)
                        emit(accumulated.toString())
                    }
                }
            }
            if (accumulated.isBlank()) {
                throw IllegalStateException("AI Guru returned an empty response. Please try again.")
            }
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            val estPrompt = if (reportedPromptTokens > 0L) reportedPromptTokens else ((fullPrompt.length / 4L) + if (bitmap != null) 258L else 0L).coerceAtLeast(1L)
            val estOutput = if (reportedOutputTokens > 0L) reportedOutputTokens else (accumulated.length / 4L).coerceAtLeast(1L)
            telemetryRepo?.logAiUsage(
                modelName = safeModelName,
                feature = "AI_CHAT",
                language = language.code,
                promptTokens = estPrompt,
                outputTokens = estOutput,
                latencyMs = elapsed,
                success = true,
                hasImage = bitmap != null
            )
        } catch (e: TimeoutCancellationException) {
            Log.e(AI_TAG, "AI Guru timed out after 60s", e)
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            telemetryRepo?.logAiUsage(
                modelName = safeModelName,
                feature = "AI_CHAT",
                language = language.code,
                promptTokens = ((fullPrompt.length / 4L) + if (bitmap != null) 258L else 0L).coerceAtLeast(1L),
                outputTokens = 0L,
                latencyMs = elapsed,
                success = false,
                hasImage = bitmap != null
            )
            telemetryRepo?.logError(
                source = "AI_LOGIC",
                severity = "WARNING",
                module = "AI_GURU",
                message = "AI Guru request timed out after 60s ($safeModelName)."
            )
            throw IllegalStateException(
                if (language == AppLanguage.BN) {
                    "৬০ সেকেন্ডের মধ্যে উত্তর আসেনি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
                } else {
                    "Request timed out after 60 seconds. Please check your connection and try again."
                },
                e
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(AI_TAG, "Firebase AI Logic error ($safeModelName)", e)
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            telemetryRepo?.logAiUsage(
                modelName = safeModelName,
                feature = "AI_CHAT",
                language = language.code,
                promptTokens = ((fullPrompt.length / 4L) + if (bitmap != null) 258L else 0L).coerceAtLeast(1L),
                outputTokens = 0L,
                latencyMs = elapsed,
                success = false,
                hasImage = bitmap != null
            )
            val severity = if (isQuotaOrRateLimitError(e)) "WARNING" else "CRITICAL"
            telemetryRepo?.logError(
                source = "AI_LOGIC",
                severity = severity,
                module = "AI_GURU",
                message = (e.localizedMessage ?: "AI Guru stream failed").take(450)
            )
            throw IllegalStateException(toUserFriendlyError(e, language), e)
        }
    }

    /**
     * Real live connection test invoked by Admin inside AI Guru Settings.
     * Confirms Firebase App Check + Gemini Free Tier endpoint reachability and latency.
     */
    suspend fun testLiveConnection(modelName: String = MODEL_FLASH_FREE): Result<AiConnectionTestResult> {
        val safeModelName = sanitizeFreeModelName(modelName)
        val model = getFreeModel(safeModelName)
        val startMs = System.currentTimeMillis()
        return try {
            val response = withTimeout(30_000L) {
                model.generateContent(
                    "Reply with exactly one short line confirming: Guru Ji Vision AI Guru Free Tier is online."
                )
            }
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            val reply = response.text?.trim().orEmpty()
            if (reply.isBlank()) {
                telemetryRepo?.logAiUsage(safeModelName, "HEALTH_CHECK", "EN", 20L, 0L, elapsed, false, false)
                Result.failure(IllegalStateException("Model responded with empty text."))
            } else {
                val pTok = response.usageMetadata?.promptTokenCount?.toLong()?.takeIf { it > 0L } ?: 20L
                val oTok = response.usageMetadata?.candidatesTokenCount?.toLong()?.takeIf { it > 0L } ?: (reply.length / 4L).coerceAtLeast(1L)
                telemetryRepo?.logAiUsage(safeModelName, "HEALTH_CHECK", "EN", pTok, oTok, elapsed, true, false)
                Result.success(AiConnectionTestResult(safeModelName, elapsed, reply.take(160)))
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            Log.e(AI_TAG, "Live AI connection test failed", e)
            telemetryRepo?.logAiUsage(safeModelName, "HEALTH_CHECK", "EN", 20L, 0L, elapsed, false, false)
            Result.failure(IllegalStateException(toUserFriendlyError(e, AppLanguage.EN), e))
        }
    }

    /**
     * Extracts structured educational study notes from an Admin-uploaded PDF document
     * using Gemini Free Tier multimodal PDF support (strictly <= 10 MB inline payload).
     */
    suspend fun extractStudyNotesFromPdf(
        pdfBytes: ByteArray,
        fileName: String,
        modelName: String = MODEL_FLASH_FREE
    ): Result<String> {
        if (pdfBytes.isEmpty()) {
            return Result.failure(IllegalArgumentException("Selected PDF file is empty."))
        }
        if (pdfBytes.size > 10 * 1024 * 1024) {
            return Result.failure(IllegalArgumentException("PDF must be 10 MB or smaller for free-tier extraction."))
        }
        val safeModelName = sanitizeFreeModelName(modelName)
        val model = getFreeModel(safeModelName)
        val startMs = System.currentTimeMillis()
        return try {
            val response = withTimeout(AI_TIMEOUT_MS) {
                model.generateContent(
                    content {
                        inlineData(pdfBytes, "application/pdf")
                        text(
                            """
                            Extract the core educational knowledge from this PDF ($fileName) for the Guru Ji Vision AI Knowledge Base.
                            Produce clean, factual plain-text study notes (definitions, key facts, crop/subject details, formulas, exam points) in under 9,000 characters.
                            Do not invent facts that are not present in the PDF.
                            """.trimIndent()
                        )
                    }
                )
            }
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            val extracted = response.text?.trim()?.take(11_500).orEmpty()
            val pTok = response.usageMetadata?.promptTokenCount?.toLong()?.takeIf { it > 0L } ?: 600L
            val oTok = response.usageMetadata?.candidatesTokenCount?.toLong()?.takeIf { it > 0L } ?: (extracted.length / 4L).coerceAtLeast(1L)
            if (extracted.isBlank()) {
                telemetryRepo?.logAiUsage(safeModelName, "PDF_EXTRACT", "EN", pTok, 0L, elapsed, false, false)
                Result.failure(IllegalStateException("Could not extract readable text from this PDF."))
            } else {
                telemetryRepo?.logAiUsage(safeModelName, "PDF_EXTRACT", "EN", pTok, oTok, elapsed, true, false)
                Result.success(extracted)
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            Log.e(AI_TAG, "PDF extraction failed", e)
            telemetryRepo?.logAiUsage(safeModelName, "PDF_EXTRACT", "EN", 600L, 0L, elapsed, false, false)
            Result.failure(IllegalStateException(toUserFriendlyError(e, AppLanguage.EN), e))
        }
    }

    suspend fun analyzeCropImageSummary(bitmap: Bitmap, cropName: String, language: AppLanguage): Result<String> {
        val safeModelName = MODEL_FLASH_FREE
        val model = getFreeModel(safeModelName)
        val startMs = System.currentTimeMillis()
        val langInstruction = if (language == AppLanguage.BN) {
            "Give a concise 2-sentence crop visual observation in Bengali (max 320 characters) noting visible leaf/plant symptoms and possible causes to check with KVK."
        } else {
            "Give a concise 2-sentence crop visual observation in English (max 320 characters) noting visible leaf/plant symptoms and possible causes to verify with an agronomist."
        }
        val promptText = "Crop: $cropName. $langInstruction"
        return try {
            val response = withTimeout(AI_TIMEOUT_MS) {
                model.generateContent(
                    content {
                        image(bitmap)
                        text(promptText)
                    }
                )
            }
            val text = response.text?.trim()?.take(380)
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            val pTokens = response.usageMetadata?.promptTokenCount?.toLong()?.takeIf { it > 0L }
                ?: ((promptText.length / 4L) + 258L)
            val oTokens = response.usageMetadata?.candidatesTokenCount?.toLong()?.takeIf { it > 0L }
                ?: ((text?.length ?: 0) / 4L)

            if (text.isNullOrBlank()) {
                telemetryRepo?.logAiUsage(safeModelName, "CROP_PHOTO_SCAN", language.code, pTokens, 0L, elapsed, false, true)
                Result.failure(IllegalStateException("Unable to analyze image."))
            } else {
                telemetryRepo?.logAiUsage(safeModelName, "CROP_PHOTO_SCAN", language.code, pTokens, oTokens, elapsed, true, true)
                Result.success(text)
            }
        } catch (e: TimeoutCancellationException) {
            Log.e(AI_TAG, "Crop image analysis timed out", e)
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            telemetryRepo?.logAiUsage(safeModelName, "CROP_PHOTO_SCAN", language.code, 280L, 0L, elapsed, false, true)
            telemetryRepo?.logError("AI_LOGIC", "WARNING", "FARMER_PHOTO_SCAN", "Crop image analysis timed out after 60s.")
            Result.failure(IllegalStateException("Crop photo analysis timed out. Please try again."))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(AI_TAG, "Crop image analysis failed", e)
            val elapsed = (System.currentTimeMillis() - startMs).coerceAtLeast(1L)
            telemetryRepo?.logAiUsage(safeModelName, "CROP_PHOTO_SCAN", language.code, 280L, 0L, elapsed, false, true)
            telemetryRepo?.logError("AI_LOGIC", "CRITICAL", "FARMER_PHOTO_SCAN", (e.localizedMessage ?: "Crop photo scan failed").take(450))
            Result.failure(IllegalStateException(toUserFriendlyError(e, language), e))
        }
    }
}
