package com.example.core

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.data.model.UserProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.json.JSONObject

private val Context.authSessionDataStore by preferencesDataStore(name = "guruji_auth_session_prefs")

data class PersistedSessionMetadata(
    val lastUserId: String = "",
    val explicitlyLoggedOut: Boolean = false,
    val lastTokenRefreshMs: Long = 0L,
    val cachedProfile: UserProfile? = null
)

/**
 * Stores ONLY non-sensitive local session metadata (never passwords or raw auth tokens)
 * to support seamless session restoration, offline profile continuity, and explicit-logout
 * tracking alongside Firebase Authentication's built-in persistent refresh token storage.
 */
class SessionPersistenceStore(private val context: Context) {

    private val keyLastUserId = stringPreferencesKey("session_last_uid")
    private val keyExplicitLogout = booleanPreferencesKey("session_explicit_logout")
    private val keyLastTokenRefreshMs = longPreferencesKey("session_last_token_refresh_ms")
    private val keyCachedProfileJson = stringPreferencesKey("session_cached_profile_json")

    val sessionMetadataFlow: Flow<PersistedSessionMetadata> =
        context.authSessionDataStore.data.map { prefs ->
            val uid = prefs[keyLastUserId].orEmpty()
            val explicitOut = prefs[keyExplicitLogout] ?: false
            val lastRefresh = prefs[keyLastTokenRefreshMs] ?: 0L
            val profile = decodeProfileCache(prefs[keyCachedProfileJson].orEmpty(), expectedUid = uid)
            PersistedSessionMetadata(
                lastUserId = uid,
                explicitlyLoggedOut = explicitOut,
                lastTokenRefreshMs = lastRefresh,
                cachedProfile = profile
            )
        }

    suspend fun readMetadata(): PersistedSessionMetadata = sessionMetadataFlow.first()

    suspend fun markSignedIn(userId: String, nowMs: Long = System.currentTimeMillis()) {
        if (userId.isBlank()) return
        context.authSessionDataStore.edit { prefs ->
            val previousUid = prefs[keyLastUserId].orEmpty()
            if (previousUid != userId) {
                prefs.remove(keyCachedProfileJson)
            }
            prefs[keyLastUserId] = userId
            prefs[keyExplicitLogout] = false
            prefs[keyLastTokenRefreshMs] = nowMs
        }
    }

    suspend fun recordTokenRefresh(nowMs: Long = System.currentTimeMillis()) {
        context.authSessionDataStore.edit { prefs ->
            prefs[keyLastTokenRefreshMs] = nowMs
        }
    }

    suspend fun cacheUserProfile(profile: UserProfile) {
        if (profile.userId.isBlank()) return
        val encoded = encodeProfileCache(profile)
        context.authSessionDataStore.edit { prefs ->
            prefs[keyLastUserId] = profile.userId
            prefs[keyExplicitLogout] = false
            prefs[keyCachedProfileJson] = encoded
        }
    }

    suspend fun getCachedProfileForUser(userId: String): UserProfile? {
        if (userId.isBlank()) return null
        val prefs = context.authSessionDataStore.data.first()
        return decodeProfileCache(prefs[keyCachedProfileJson].orEmpty(), expectedUid = userId)
    }

    /**
     * Called ONLY when the user explicitly clicks and confirms Logout.
     * Clears cached profile metadata and sets `explicitlyLoggedOut = true` so
     * the app does not silently auto-sign the user back in on the login screen.
     */
    suspend fun markExplicitSignOut() {
        context.authSessionDataStore.edit { prefs ->
            prefs[keyExplicitLogout] = true
            prefs.remove(keyLastUserId)
            prefs.remove(keyLastTokenRefreshMs)
            prefs.remove(keyCachedProfileJson)
        }
    }

    companion object {
        fun encodeProfileCache(profile: UserProfile): String {
            return JSONObject().apply {
                put("userId", profile.userId)
                put("displayName", profile.displayName)
                put("email", profile.email)
                put("role", profile.role)
                put("institutionOrVillage", profile.institutionOrVillage)
                put("district", profile.district)
                put("semester", profile.semester)
                put("language", profile.language)
                put("photoUrl", profile.photoUrl)
            }.toString()
        }

        fun decodeProfileCache(rawJson: String, expectedUid: String): UserProfile? {
            if (rawJson.isBlank() || expectedUid.isBlank()) return null
            return try {
                val obj = JSONObject(rawJson)
                val cachedUid = obj.optString("userId").trim()
                // Strict multi-user isolation: never serve cached profile for another UID
                if (cachedUid.isBlank() || cachedUid != expectedUid) return null
                UserProfile(
                    id = cachedUid,
                    userId = cachedUid,
                    displayName = obj.optString("displayName"),
                    email = obj.optString("email"),
                    role = obj.optString("role", "STUDENT"),
                    institutionOrVillage = obj.optString("institutionOrVillage"),
                    district = obj.optString("district"),
                    semester = obj.optLong("semester", 1L),
                    language = obj.optString("language", "EN"),
                    photoUrl = obj.optString("photoUrl")
                )
            } catch (_: Exception) {
                null
            }
        }
    }
}
