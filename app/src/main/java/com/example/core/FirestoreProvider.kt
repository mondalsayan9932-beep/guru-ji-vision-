package com.example.core

import android.content.Context
import android.util.Log
import com.example.R
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.PersistentCacheSettings
import java.util.concurrent.atomic.AtomicBoolean

private const val FS_PROVIDER_TAG = "FirestoreProvider"

/**
 * Returns the provisioned named Firestore database instance with persistent local
 * disk caching explicitly enabled so users stay logged in with full offline read/write
 * continuity across app restarts and temporary network disconnections.
 */
object FirestoreProvider {
    private val settingsApplied = AtomicBoolean(false)

    fun getInstance(context: Context): FirebaseFirestore {
        val appContext = context.applicationContext
        val dbId = appContext.getString(R.string.firestore_database_id)
        val db = FirebaseFirestore.getInstance(dbId)
        if (settingsApplied.compareAndSet(false, true)) {
            try {
                val settings = FirebaseFirestoreSettings.Builder()
                    .setLocalCacheSettings(
                        PersistentCacheSettings.newBuilder()
                            .setSizeBytes(FirebaseFirestoreSettings.CACHE_SIZE_UNLIMITED)
                            .build()
                    )
                    .build()
                db.firestoreSettings = settings
            } catch (e: IllegalStateException) {
                // Firestore instance was already started; persistent cache is already active by default on Android
                Log.d(FS_PROVIDER_TAG, "Firestore settings already initialized: ${e.message}")
            } catch (e: Exception) {
                Log.w(FS_PROVIDER_TAG, "Skipping custom Firestore cache settings: ${e.message}")
            }
        }
        return db
    }
}
