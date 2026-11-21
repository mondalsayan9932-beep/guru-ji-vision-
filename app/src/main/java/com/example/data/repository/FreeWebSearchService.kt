package com.example.data.repository

import android.util.Log
import com.example.core.AppLanguage
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

private const val SEARCH_TAG = "FreeWebSearch"
private const val SEARCH_TIMEOUT_MS = 6_000

/**
 * Source attribution chip shown beneath AI Guru answers whenever Guru Ji Vision
 * study materials or free Wikipedia references are used.
 */
data class AiSourceLink(
    val title: String,
    val url: String = "",
    val snippet: String = "",
    val kind: String = KIND_KNOWLEDGE_BASE // KNOWLEDGE_BASE or WEB_WIKIPEDIA
) {
    companion object {
        const val KIND_KNOWLEDGE_BASE = "KNOWLEDGE_BASE"
        const val KIND_WEB_WIKIPEDIA = "WEB_WIKIPEDIA"
    }
}

/**
 * Genuinely FREE, zero-billing, zero-API-key educational web search powered by
 * the Wikimedia / Wikipedia MediaWiki Open Action API (English & Bengali editions).
 *
 * - Requires NO API key and NO paid subscription.
 * - Complies with Wikimedia API etiquette via an explicit User-Agent header.
 * - Fails gracefully (returns emptyList) if offline or unreachable so AI Guru
 *   always continues answering from Gemini Free Tier + Guru Ji Vision Knowledge Base.
 */
class FreeWebSearchService {

    suspend fun searchFreeEncyclopedia(
        query: String,
        language: AppLanguage,
        maxResults: Int = 3
    ): List<AiSourceLink> = withContext(Dispatchers.IO) {
        val cleanQuery = sanitizeSearchQuery(query)
        if (cleanQuery.length < 3) return@withContext emptyList()

        val primaryLang = if (language == AppLanguage.BN) "bn" else "en"
        val primaryHits = fetchWikipedia(cleanQuery, primaryLang, maxResults)
        if (primaryHits.isNotEmpty() || primaryLang == "en") {
            return@withContext primaryHits
        }
        // Fallback to English Wikipedia if Bengali Wikipedia had no direct match
        fetchWikipedia(cleanQuery, "en", maxResults)
    }

    private fun fetchWikipedia(
        query: String,
        wikiLang: String,
        maxResults: Int
    ): List<AiSourceLink> {
        var connection: HttpURLConnection? = null
        return try {
            val encoded = URLEncoder.encode(query, "UTF-8")
            val endpoint =
                "https://$wikiLang.wikipedia.org/w/api.php?action=query&list=search&srsearch=$encoded&srlimit=$maxResults&utf8=1&format=json"
            connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = SEARCH_TIMEOUT_MS
                readTimeout = SEARCH_TIMEOUT_MS
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "GuruJiVisionApp/1.0 (Indian Agriculture Education App; Free Educational Use)")
            }
            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                Log.w(SEARCH_TAG, "Wikipedia ($wikiLang) returned HTTP ${connection.responseCode}")
                return emptyList()
            }
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            parseWikipediaSearchJson(body, wikiLang)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(SEARCH_TAG, "Free Wikipedia search skipped ($wikiLang): ${e.localizedMessage}")
            emptyList()
        } finally {
            connection?.disconnect()
        }
    }

    companion object {
        internal fun sanitizeSearchQuery(raw: String): String {
            return raw
                .replace(Regex("[\\r\\n]+"), " ")
                .replace(Regex("[^\\p{L}\\p{N}\\s\\-.,()]+"), " ")
                .trim()
                .take(120)
        }

        internal fun stripHtmlTags(html: String): String {
            return html
                .replace(Regex("<[^>]*>"), "")
                .replace("&quot;", "\"")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&#39;", "'")
                .replace(Regex("\\s+"), " ")
                .trim()
        }

        fun parseWikipediaSearchJson(jsonBody: String, wikiLang: String = "en"): List<AiSourceLink> {
            return try {
                val root = JSONObject(jsonBody)
                val queryObj = root.optJSONObject("query") ?: return emptyList()
                val arr = queryObj.optJSONArray("search") ?: return emptyList()
                val results = mutableListOf<AiSourceLink>()
                for (i in 0 until arr.length()) {
                    val item = arr.optJSONObject(i) ?: continue
                    val title = item.optString("title").trim()
                    if (title.isBlank()) continue
                    val snippet = stripHtmlTags(item.optString("snippet")).take(280)
                    val slug = URLEncoder.encode(title.replace(' ', '_'), "UTF-8")
                        .replace("%2F", "/")
                    val articleUrl = "https://$wikiLang.wikipedia.org/wiki/$slug"
                    results.add(
                        AiSourceLink(
                            title = "$title (Wikipedia)",
                            url = articleUrl,
                            snippet = snippet,
                            kind = AiSourceLink.KIND_WEB_WIKIPEDIA
                        )
                    )
                }
                results
            } catch (_: Exception) {
                emptyList()
            }
        }
    }
}
