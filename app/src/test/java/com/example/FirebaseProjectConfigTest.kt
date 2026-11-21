package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.repository.sanitizePublicAccountRole
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class FirebaseProjectConfigTest {

    @Test
    fun `android build is configured with applicationId v2prod and guru-ji-vision Firebase project`() {
        val context = ApplicationProvider.getApplicationContext<Context>()

        assertEquals("com.aistudio.gurujivision.v2prod", BuildConfig.APPLICATION_ID)
        assertEquals("com.aistudio.gurujivision.v2prod", context.packageName)

        // Generated at build time by com.google.gms.google-services from app/google-services.json
        assertEquals("guru-ji-vision", context.getString(R.string.project_id))
        assertEquals(
            "guru-ji-vision.firebasestorage.app",
            context.getString(R.string.google_storage_bucket)
        )
        assertEquals(
            "725784257884",
            context.getString(R.string.gcm_defaultSenderId)
        )

        val webClientId = context.getString(R.string.default_web_client_id)
        assertTrue(
            "Expected guru-ji-vision OAuth Web Client ID, got: $webClientId",
            webClientId.startsWith("725784257884-") && webClientId.endsWith(".apps.googleusercontent.com")
        )

        val firestoreDbId = context.getString(R.string.firestore_database_id)
        assertEquals(
            "ai-studio-android-gurujivi-641f324c-f73f-4600-a445-e4253ef6fa80",
            firestoreDbId
        )
    }

    @Test
    fun `public role sanitization never permits admin or founder self-assignment`() {
        assertEquals("STUDENT", sanitizePublicAccountRole("ADMIN"))
        assertEquals("STUDENT", sanitizePublicAccountRole("FOUNDER"))
        assertEquals("STUDENT", sanitizePublicAccountRole("PROFESSOR"))
        assertEquals("STUDENT", sanitizePublicAccountRole("student"))
        assertEquals("FARMER", sanitizePublicAccountRole("farmer"))
    }
}
