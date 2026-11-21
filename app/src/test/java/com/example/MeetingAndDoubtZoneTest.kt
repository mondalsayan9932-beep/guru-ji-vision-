package com.example

import com.example.data.model.MeetingSession
import com.example.data.model.ProfessorDirectorySeed
import com.example.data.model.ProfessorProfile
import com.example.data.model.buildDoubtChatId
import com.example.data.model.isUpcomingMeeting
import com.example.data.model.isValidGoogleMeetUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MeetingAndDoubtZoneTest {

    @Test
    fun officialFacultyDirectory_hasExactNineAdvisorsWithNoInventedFields() {
        val faculty = ProfessorDirectorySeed.officialFaculty
        assertEquals(9, faculty.size)

        // 1. Dr. Anulina Manna
        val p1 = faculty[0]
        assertEquals("Dr. Anulina Manna", p1.name)
        assertEquals("Assistant Professor", p1.designation)
        assertEquals("M.Sc., PhD", p1.qualification)
        assertEquals("Botany", p1.subject)
        assertEquals("Biological Science", p1.department)
        assertEquals("anuman.lin@gmail.com", p1.email)
        assertEquals("Tissue Culture and Biological Related Advisor", p1.specialization)

        // 2. Dr. Sudip Bhattacharya
        val p2 = faculty[1]
        assertEquals("Dr. Sudip Bhattacharya", p2.name)
        assertEquals("sudipbhattacharya234@gmail.com", p2.email)
        assertEquals("Genetics Related Advisor", p2.specialization)

        // 3. Dr. Pratonu Bandyopadhyay
        val p3 = faculty[2]
        assertEquals("Dr. Pratonu Bandyopadhyay", p3.name)
        assertEquals("pratonu31@gmail.com", p3.email)
        assertEquals("Agronomy Related Advisor", p3.specialization)

        // 4. Dr. Subhas Patar
        val p4 = faculty[3]
        assertEquals("Dr. Subhas Patar", p4.name)
        assertEquals("subhaspatar@gmail.com", p4.email)
        assertEquals("Plant Pathology and Entomology Related Advisor", p4.specialization)

        // 5. Dr. Monirul Haque — missing qualification, subject, and email MUST remain empty (never invented)
        val p5 = faculty[4]
        assertEquals("Dr. Monirul Haque", p5.name)
        assertEquals("Assistant Professor", p5.designation)
        assertEquals("", p5.qualification)
        assertEquals("", p5.subject)
        assertEquals("Biological Sciences", p5.department)
        assertEquals("", p5.email)
        assertEquals("Agricultural Extension and Rural Development Related Advisor", p5.specialization)

        // 6. Dr. Soumyajyoti Das
        val p6 = faculty[5]
        assertEquals("Dr. Soumyajyoti Das", p6.name)
        assertEquals("soumyasjd@gmail.com", p6.email)
        assertEquals("Intellectual Property Rights (IPR) Related Advisor", p6.specialization)

        // 7. Dr. Shrabanti Maity — missing email MUST remain empty (never invented)
        val p7 = faculty[6]
        assertEquals("Dr. Shrabanti Maity", p7.name)
        assertEquals("M.Sc., PhD", p7.qualification)
        assertEquals("Agriculture", p7.subject)
        assertEquals("Biological Science", p7.department)
        assertEquals("", p7.email)
        assertEquals("Agronomy Related Sub-Advisor", p7.specialization)

        // 8. Dr. Anirban Bhowmik
        val p8 = faculty[7]
        assertEquals("Dr. Anirban Bhowmik", p8.name)
        assertEquals("bhowmik.anirban1@gmail.com", p8.email)
        assertEquals("Soil Science Related Advisor", p8.specialization)

        // 9. Biswanath Sardar
        val p9 = faculty[8]
        assertEquals("Biswanath Sardar", p9.name)
        assertEquals("Technical Assistant", p9.designation)
        assertEquals("B.Sc.", p9.qualification)
        assertEquals("Agriculture", p9.subject)
        assertEquals("Biological Science", p9.department)
        assertEquals("sardarbiswanath8597@gmail.com", p9.email)
        assertEquals("Agricultural Laboratory Management Related Advisor", p9.specialization)
    }

    @Test
    fun googleMeetUrlValidation_acceptsOnlyValidHttpsMeetLinks() {
        assertTrue(isValidGoogleMeetUrl("https://meet.google.com/abc-defg-hij"))
        assertTrue(isValidGoogleMeetUrl("https://meet.google.com/lookup/agri-class-1"))
        assertFalse(isValidGoogleMeetUrl("http://meet.google.com/abc-defg-hij"))
        assertFalse(isValidGoogleMeetUrl("https://evil.example.com/meet.google.com/abc"))
        assertFalse(isValidGoogleMeetUrl("https://meet.google.com/"))
        assertFalse(isValidGoogleMeetUrl(""))
    }

    @Test
    fun doubtChatId_isolatesEachStudentProfessorPair() {
        val chatA = buildDoubtChatId("prof_anulina_manna", "student_001")
        val chatB = buildDoubtChatId("prof_anulina_manna", "student_002")
        val chatOtherProf = buildDoubtChatId("prof_sudip_bhattacharya", "student_001")

        assertEquals("prof_anulina_manna__student_001", chatA)
        assertNotEquals(chatA, chatB)
        assertNotEquals(chatA, chatOtherProf)
    }

    @Test
    fun upcomingVsPastMeetingClassification_usesScheduledEpochWithGraceWindow() {
        val now = 1_750_000_000_000L
        val futureMeeting = MeetingSession(id = "m1", scheduledAtEpochMs = now + 3_600_000L)
        val ongoingMeeting = MeetingSession(id = "m2", scheduledAtEpochMs = now - 30 * 60_000L)
        val pastMeeting = MeetingSession(id = "m3", scheduledAtEpochMs = now - 4 * 3_600_000L)

        assertTrue(isUpcomingMeeting(futureMeeting, now))
        assertTrue(isUpcomingMeeting(ongoingMeeting, now))
        assertFalse(isUpcomingMeeting(pastMeeting, now))
    }

    @Test
    fun mergeWithRemote_preservesAllNineFacultyAndAppliesAdminUpdates() {
        val remoteOverride = ProfessorProfile(
            id = "prof_monirul_haque",
            name = "Dr. Monirul Haque",
            designation = "Assistant Professor",
            department = "Biological Sciences",
            specialization = "Agricultural Extension and Rural Development Related Advisor",
            authorizedUid = "uid_monirul_verified",
            active = true,
            displayOrder = 5
        )
        val merged = ProfessorDirectorySeed.mergeWithRemote(listOf(remoteOverride))
        assertEquals(9, merged.size)
        val updated = merged.first { it.id == "prof_monirul_haque" }
        assertEquals("uid_monirul_verified", updated.authorizedUid)
        assertEquals("", updated.email)
    }
}
