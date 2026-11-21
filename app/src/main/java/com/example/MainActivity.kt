package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.core.AppLanguage
import com.example.core.LanguageStore
import com.example.core.configureAppCheck
import com.example.ui.navigation.AppRoot
import com.example.ui.theme.GuruJiVisionTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // STEP 1: Mandatory Firebase App Check wiring with launch intent before any UI or Firebase calls
        configureAppCheck(this, intent)

        // STEP 2: Edge-to-edge layout
        enableEdgeToEdge()

        setContent {
            val languageStore = remember { LanguageStore(applicationContext) }
            val language by languageStore.languageFlow.collectAsStateWithLifecycle(initialValue = AppLanguage.EN)
            val scope = rememberCoroutineScope()

            GuruJiVisionTheme(isBengali = language == AppLanguage.BN) {
                AppRoot(
                    language = language,
                    onLanguageChange = { nextLang ->
                        scope.launch { languageStore.setLanguage(nextLang) }
                    }
                )
            }
        }
    }
}
