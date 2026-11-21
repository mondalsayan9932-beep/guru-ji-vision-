package com.example.core

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.data.repository.AiSourceLink
import kotlinx.coroutines.flow.first
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val Context.aiGuruDataStore by preferencesDataStore(name = "guruji_ai_guru_store")

data class StoredAiMessage(
    val id: String,
    val fromUser: Boolean,
    val text: String,
    val hasCropPhoto: Boolean = false,
    val studyMode: String = "GENERAL",
    val usedKnowledgeBase: Boolean = false,
    val sources: List<AiSourceLink> = emptyList(),
    val timestampMs: Long = 0L
)

/**
 * Privacy-first on-device storage for AI Guru:
 * 1. Preserves each user's AI Guru chat history locally without storing personal questions on the server.
 * 2. Tracks per-user daily question count to enforce Admin's free-tier anti-abuse quota limit.
 */
class AiGuruLocalStore(private val context: Context) {

    private fun historyKey(userId: String) = stringPreferencesKey("ai_history_${userId.take(40)}")
    private fun quotaDateKey(userId: String) = stringPreferencesKey("ai_quota_date_${userId.take(40)}")
    private fun quotaCountKey(userId: String) = intPreferencesKey("ai_quota_count_${userId.take(40)}")

    private fun todayDateKey(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    suspend fun loadChatHistory(userId: String): List<StoredAiMessage> {
        val prefs = context.aiGuruDataStore.data.first()
        val raw = prefs[historyKey(userId)] ?: return emptyList()
        return decodeMessagesJson(raw)
    }

    suspend fun saveChatHistory(userId: String, messages: List<StoredAiMessage>) {
        // Retain the latest 60 messages to stay compact and fast
        val trimmed = messages.takeLast(60)
        val json = encodeMessagesJson(trimmed)
        context.aiGuruDataStore.edit { prefs ->
            prefs[historyKey(userId)] = json
        }
    }

    suspend fun clearChatHistory(userId: String) {
        context.aiGuruDataStore.edit { prefs ->
            prefs.remove(historyKey(userId))
        }
    }

    suspend fun getUsedCountToday(userId: String): Int {
        val prefs = context.aiGuruDataStore.data.first()
        val storedDate = prefs[quotaDateKey(userId)]
        val today = todayDateKey()
        return if (storedDate == today) prefs[quotaCountKey(userId)] ?: 0 else 0
    }

    suspend fun incrementUsedCountToday(userId: String): Int {
        val today = todayDateKey()
        var updatedCount = 1
        context.aiGuruDataStore.edit { prefs ->
            val current = if (prefs[quotaDateKey(userId)] == today) prefs[quotaCountKey(userId)] ?: 0 else 0
            updatedCount = current + 1
            prefs[quotaDateKey(userId)] = today
            prefs[quotaCountKey(userId)] = updatedCount
        }
        return updatedCount
    }

    companion object {
        fun encodeMessagesJson(messages: List<StoredAiMessage>): String {
            val arr = JSONArray()
            messages.forEach { msg ->
                val obj = JSONObject().apply {
                    put("id", msg.id)
                    put("fromUser", msg.fromUser)
                    put("text", msg.text)
                    put("hasCropPhoto", msg.hasCropPhoto)
                    put("studyMode", msg.studyMode)
                    put("usedKnowledgeBase", msg.usedKnowledgeBase)
                    put("timestampMs", msg.timestampMs)
                    val srcArr = JSONArray()
                    msg.sources.forEach { src ->
                        srcArr.put(
                            JSONObject().apply {
                                put("title", src.title)
                                put("url", src.url)
                                put("snippet", src.snippet)
                                put("kind", src.kind)
                            }
                        )
                    }
                    put("sources", srcArr)
                }
                arr.put(obj)
            }
            return arr.toString()
        }

        fun decodeMessagesJson(raw: String): List<StoredAiMessage> {
            return try {
                val arr = JSONArray(raw)
                val out = mutableListOf<StoredAiMessage>()
                for (i in 0 until arr.length()) {
                    val obj = arr.optJSONObject(i) ?: continue
                    val sources = mutableListOf<AiSourceLink>()
                    val srcArr = obj.optJSONArray("sources")
                    if (srcArr != null) {
                        for (j in 0 until srcArr.length()) {
                            val s = srcArr.optJSONObject(j) ?: continue
                            sources.add(
                                AiSourceLink(
                                    title = s.optString("title"),
                                    url = s.optString("url"),
                                    snippet = s.optString("snippet"),
                                    kind = s.optString("kind", AiSourceLink.KIND_KNOWLEDGE_BASE)
                                )
                            )
                        }
                    }
                    out.add(
                        StoredAiMessage(
                            id = obj.optString("id"),
                            fromUser = obj.optBoolean("fromUser", false),
                            text = obj.optString("text"),
                            hasCropPhoto = obj.optBoolean("hasCropPhoto", false),
                            studyMode = obj.optString("studyMode", "GENERAL"),
                            usedKnowledgeBase = obj.optBoolean("usedKnowledgeBase", false),
                            sources = sources,
                            timestampMs = obj.optLong("timestampMs", 0L)
                        )
                    )
                }
                out
            } catch (_: Exception) {
                emptyList()
            }
        }
    }
}
