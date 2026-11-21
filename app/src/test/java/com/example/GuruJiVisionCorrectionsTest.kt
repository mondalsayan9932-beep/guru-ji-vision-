package com.example

import com.example.core.ReportTimeframe
import com.example.core.buildOwnerReportSnapshot
import com.example.data.model.AppSettings
import com.example.data.model.MoneyTransaction
import com.example.data.model.UserProfile
import com.example.data.repository.sanitizePublicAccountRole
import com.example.ui.components.OFFICIAL_WHATSAPP_GROUP_INVITE_URL
import com.example.ui.components.resolveWhatsAppGroupInviteUrl
import com.example.ui.screens.computeMonthlyFinanceSummaries
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GuruJiVisionCorrectionsTest {

    @Test
    fun whatsappGroupInviteUrl_preservesExactOfficialLink_andNeverConvertsToWaMe() {
        val exactUrl = "https://chat.whatsapp.com/FUtzkunI4u097tdsa1dIxl?s=cl&p=a&iam=2"
        assertEquals(exactUrl, OFFICIAL_WHATSAPP_GROUP_INVITE_URL)
        assertEquals(exactUrl, AppSettings().whatsappGroupInviteUrl)
        assertEquals(exactUrl, resolveWhatsAppGroupInviteUrl(exactUrl))
        assertEquals(exactUrl, resolveWhatsAppGroupInviteUrl(""))
        assertEquals(exactUrl, resolveWhatsAppGroupInviteUrl(null))
        assertEquals(exactUrl, resolveWhatsAppGroupInviteUrl("https://wa.me/919876543210"))
        assertFalse(resolveWhatsAppGroupInviteUrl(exactUrl).contains("wa.me"))
    }

    @Test
    fun publicRegistrationRole_blocksFounderAndAdminSelfRegistration() {
        assertEquals("STUDENT", sanitizePublicAccountRole("STUDENT"))
        assertEquals("STUDENT", sanitizePublicAccountRole("student"))
        assertEquals("FARMER", sanitizePublicAccountRole("FARMER"))
        assertEquals("FARMER", sanitizePublicAccountRole(" farmer "))

        // Public users must NEVER be able to register as Founder, Owner, or Admin
        assertEquals("STUDENT", sanitizePublicAccountRole("ADMIN"))
        assertEquals("STUDENT", sanitizePublicAccountRole("FOUNDER"))
        assertEquals("STUDENT", sanitizePublicAccountRole("SUPER_ADMIN"))
        assertEquals("STUDENT", sanitizePublicAccountRole("OWNER"))
        assertEquals("STUDENT", sanitizePublicAccountRole(""))
    }

    @Test
    fun studentMoneyManager_computesMonthlyIncomeExpenseAndRemainingBalance() {
        val transactions = listOf(
            MoneyTransaction(
                id = "t1",
                title = "Monthly Allowance",
                amount = 10000.0,
                type = "INCOME",
                category = "ALLOWANCE",
                dateLabel = "2026-11-01"
            ),
            MoneyTransaction(
                id = "t2",
                title = "Hostel Mess",
                amount = 3500.0,
                type = "EXPENSE",
                category = "FOOD_MESS",
                dateLabel = "2026-11-05"
            ),
            MoneyTransaction(
                id = "t3",
                title = "Lab Manual Books",
                amount = 1200.0,
                type = "EXPENSE",
                category = "EDUCATION",
                dateLabel = "2026-11-12"
            ),
            MoneyTransaction(
                id = "t4",
                title = "ICAR Scholarship",
                amount = 5000.0,
                type = "INCOME",
                category = "SCHOLARSHIP",
                dateLabel = "2026-10-15"
            ),
            MoneyTransaction(
                id = "t5",
                title = "Bus Pass & Recharge",
                amount = 800.0,
                type = "EXPENSE",
                category = "TRAVEL_RECHARGE",
                dateLabel = "2026-10-20"
            )
        )

        val summaries = computeMonthlyFinanceSummaries(transactions)
        assertEquals(2, summaries.size)

        val nov = summaries[0]
        assertEquals("2026-11", nov.monthKey)
        assertEquals(10000.0, nov.income, 0.001)
        assertEquals(4700.0, nov.expense, 0.001)
        assertEquals(5300.0, nov.remainingBalance, 0.001)

        val oct = summaries[1]
        assertEquals("2026-10", oct.monthKey)
        assertEquals(5000.0, oct.income, 0.001)
        assertEquals(800.0, oct.expense, 0.001)
        assertEquals(4200.0, oct.remainingBalance, 0.001)
    }

    @Test
    fun ownerReportSnapshot_excludesAllPrivateStudentFinancialCollections() {
        val snapshot = buildOwnerReportSnapshot(
            timeframe = ReportTimeframe.WEEKLY_7D,
            users = listOf(
                UserProfile(id = "u1", userId = "u1", displayName = "Riya", role = "STUDENT"),
                UserProfile(id = "u2", userId = "u2", displayName = "Suman", role = "FARMER")
            ),
            activities = emptyList(),
            queries = emptyList(),
            materials = emptyList(),
            quizzes = emptyList(),
            examStats = emptyList(),
            aiLogs = emptyList(),
            errorLogs = emptyList(),
            reports = emptyList(),
            careers = emptyList(),
            posts = emptyList(),
            announcements = emptyList(),
            admins = emptyList()
        )

        assertEquals(2, snapshot.totalUsers)
        assertEquals(1, snapshot.studentCount)
        assertEquals(1, snapshot.farmerCount)

        val collectionNames = snapshot.collectionFootprints.map { it.collectionName.lowercase() }
        assertTrue(collectionNames.none { it.contains("transaction") || it.contains("budget") || it.contains("money") })
    }
}
