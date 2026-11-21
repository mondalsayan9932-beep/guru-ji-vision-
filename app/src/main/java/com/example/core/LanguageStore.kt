package com.example.core

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.languageDataStore by preferencesDataStore(name = "guruji_vision_prefs")

enum class AppLanguage(val code: String, val displayLabel: String) {
    EN("EN", "English"),
    BN("BN", "বাংলা");

    companion object {
        fun fromCode(code: String?): AppLanguage =
            entries.firstOrNull { it.code.equals(code, ignoreCase = true) } ?: EN
    }
}

class LanguageStore(private val context: Context) {
    private val keyLanguage = stringPreferencesKey("app_language")

    val languageFlow: Flow<AppLanguage> = context.languageDataStore.data.map { prefs ->
        AppLanguage.fromCode(prefs[keyLanguage])
    }

    suspend fun setLanguage(language: AppLanguage) {
        context.languageDataStore.edit { prefs ->
            prefs[keyLanguage] = language.code
        }
    }
}
