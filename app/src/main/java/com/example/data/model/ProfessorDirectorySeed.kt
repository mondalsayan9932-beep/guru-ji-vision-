package com.example.data.model

import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Authoritative 9-member Guru Ji Vision Faculty & Advisor Directory.
 * IMPORTANT: Never invent missing qualifications, subjects, or email addresses.
 */
object ProfessorDirectorySeed {

    val officialFaculty: List<ProfessorProfile> = listOf(
        ProfessorProfile(
            id = "prof_anulina_manna",
            name = "Dr. Anulina Manna",
            designation = "Assistant Professor",
            qualification = "M.Sc., PhD",
            subject = "Botany",
            department = "Biological Science",
            email = "anuman.lin@gmail.com",
            specialization = "Tissue Culture and Biological Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 1L
        ),
        ProfessorProfile(
            id = "prof_sudip_bhattacharya",
            name = "Dr. Sudip Bhattacharya",
            designation = "Assistant Professor",
            qualification = "M.Sc., PhD",
            subject = "Agriculture",
            department = "Biological Science",
            email = "sudipbhattacharya234@gmail.com",
            specialization = "Genetics Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 2L
        ),
        ProfessorProfile(
            id = "prof_pratonu_bandyopadhyay",
            name = "Dr. Pratonu Bandyopadhyay",
            designation = "Assistant Professor",
            qualification = "M.Sc., PhD",
            subject = "Agriculture",
            department = "Biological Science",
            email = "pratonu31@gmail.com",
            specialization = "Agronomy Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 3L
        ),
        ProfessorProfile(
            id = "prof_subhas_patar",
            name = "Dr. Subhas Patar",
            designation = "Assistant Professor",
            qualification = "M.Sc., PhD",
            subject = "Agriculture",
            department = "Biological Science",
            email = "subhaspatar@gmail.com",
            specialization = "Plant Pathology and Entomology Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 4L
        ),
        ProfessorProfile(
            id = "prof_monirul_haque",
            name = "Dr. Monirul Haque",
            designation = "Assistant Professor",
            qualification = "",
            subject = "",
            department = "Biological Sciences",
            email = "",
            specialization = "Agricultural Extension and Rural Development Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 5L
        ),
        ProfessorProfile(
            id = "prof_soumyajyoti_das",
            name = "Dr. Soumyajyoti Das",
            designation = "Assistant Professor",
            qualification = "M.Sc., PhD",
            subject = "Agriculture",
            department = "Biological Science",
            email = "soumyasjd@gmail.com",
            specialization = "Intellectual Property Rights (IPR) Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 6L
        ),
        ProfessorProfile(
            id = "prof_shrabanti_maity",
            name = "Dr. Shrabanti Maity",
            designation = "Assistant Professor",
            qualification = "M.Sc., PhD",
            subject = "Agriculture",
            department = "Biological Science",
            email = "",
            specialization = "Agronomy Related Sub-Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 7L
        ),
        ProfessorProfile(
            id = "prof_anirban_bhowmik",
            name = "Dr. Anirban Bhowmik",
            designation = "Assistant Professor",
            qualification = "M.Sc., PhD",
            subject = "Agriculture",
            department = "Biological Science",
            email = "bhowmik.anirban1@gmail.com",
            specialization = "Soil Science Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 8L
        ),
        ProfessorProfile(
            id = "prof_biswanath_sardar",
            name = "Biswanath Sardar",
            designation = "Technical Assistant",
            qualification = "B.Sc.",
            subject = "Agriculture",
            department = "Biological Science",
            email = "sardarbiswanath8597@gmail.com",
            specialization = "Agricultural Laboratory Management Related Advisor",
            canHostMeetings = true,
            active = true,
            displayOrder = 9L
        )
    )

    val knownFacultyEmails: Set<String> = officialFaculty
        .map { it.email.trim().lowercase(Locale.ROOT) }
        .filter { it.isNotBlank() }
        .toSet()

    fun findByEmail(email: String?): ProfessorProfile? {
        val clean = email?.trim()?.lowercase(Locale.ROOT).orEmpty()
        if (clean.isBlank()) return null
        return officialFaculty.firstOrNull { it.email.equals(clean, ignoreCase = true) }
    }

    /**
     * Merges remote Firestore professor overrides onto the authoritative 9-faculty directory
     * so all 9 faculty members are always available while Founder edits/additions sync live.
     */
    fun mergeWithRemote(remote: List<ProfessorProfile>): List<ProfessorProfile> {
        val byId = linkedMapOf<String, ProfessorProfile>()
        officialFaculty.forEach { byId[it.id] = it }
        remote.forEach { prof ->
            if (prof.id.isNotBlank()) {
                byId[prof.id] = prof
            }
        }
        return byId.values
            .filter { it.active }
            .sortedWith(compareBy<ProfessorProfile> { it.displayOrder }.thenBy { it.name })
    }
}

private val GOOGLE_MEET_URL_REGEX =
    Regex("^https://meet\\.google\\.com/[a-zA-Z0-9_\\-/?=&]+$")

fun isValidGoogleMeetUrl(rawUrl: String): Boolean {
    val trimmed = rawUrl.trim()
    return trimmed.length in 15..300 && GOOGLE_MEET_URL_REGEX.matches(trimmed)
}

fun buildDoubtChatId(professorId: String, studentId: String): String =
    "${professorId.trim()}__${studentId.trim()}"

/**
 * Parses YYYY-MM-DD + time string (e.g., "04:00 PM" or "16:00") into epoch milliseconds
 * so Upcoming vs Past meetings separate reliably across devices.
 */
fun parseMeetingEpochMs(dateStr: String, timeStr: String, fallbackNowMs: Long = System.currentTimeMillis()): Long {
    val cleanDate = dateStr.trim()
    val cleanTime = timeStr.trim().uppercase(Locale.ENGLISH)
    val patterns = listOf(
        "yyyy-MM-dd hh:mm a",
        "yyyy-MM-dd h:mm a",
        "yyyy-MM-dd HH:mm",
        "yyyy-MM-dd H:mm",
        "dd-MM-yyyy hh:mm a",
        "dd/MM/yyyy hh:mm a",
        "dd-MM-yyyy HH:mm"
    )
    for (pattern in patterns) {
        try {
            val fmt = SimpleDateFormat(pattern, Locale.ENGLISH).apply { isLenient = false }
            val parsed = fmt.parse("$cleanDate $cleanTime")
            if (parsed != null) return parsed.time
        } catch (_: Exception) {
            // Try next format
        }
    }
    return try {
        val dateOnly = SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH).apply { isLenient = false }
        dateOnly.parse(cleanDate)?.time ?: fallbackNowMs
    } catch (_: Exception) {
        fallbackNowMs
    }
}

fun isUpcomingMeeting(meeting: MeetingSession, nowMs: Long = System.currentTimeMillis()): Boolean {
    // Give a 60-minute live grace window after scheduled start before moving to Past Meetings
    val liveGraceMs = 60L * 60L * 1000L
    return meeting.scheduledAtEpochMs + liveGraceMs >= nowMs
}
