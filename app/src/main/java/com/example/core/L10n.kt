package com.example.core

import java.text.NumberFormat
import java.util.Locale

fun formatInr(amount: Double): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    formatter.maximumFractionDigits = if (amount % 1.0 == 0.0) 0 else 2
    return formatter.format(amount)
}

/**
 * Bilingual UI text helper for English (EN) and Bengali (বাংলা / BN).
 */
fun t(lang: AppLanguage, en: String, bn: String): String =
    if (lang == AppLanguage.BN) bn else en

object L10n {
    fun brandName(lang: AppLanguage) = t(lang, "Guru Ji Vision", "গুরু জি ভিশন")
    fun tagline(lang: AppLanguage) = t(
        lang,
        "All-in-One Agriculture & Education Ecosystem",
        "কৃষি ও শিক্ষার সম্পূর্ণ ডিজিটাল ইকোসিস্টেম"
    )
    fun navHome(lang: AppLanguage) = t(lang, "Home", "হোম")
    fun navStudent(lang: AppLanguage) = t(lang, "Student", "শিক্ষার্থী")
    fun navFarmer(lang: AppLanguage) = t(lang, "Farmer", "কৃষক")
    fun navTools(lang: AppLanguage) = t(lang, "Tools", "টুলস")
    fun navAi(lang: AppLanguage) = t(lang, "AI Guru", "এআই গুরু")
    fun navCommunity(lang: AppLanguage) = t(lang, "Career+", "ক্যারিয়ার+")
    fun navAdmin(lang: AppLanguage) = t(lang, "Admin", "অ্যাডমিন")

    fun signInWithGoogle(lang: AppLanguage) = t(lang, "Continue with Google", "Google দিয়ে লগইন করুন")
    fun studentRole(lang: AppLanguage) = t(lang, "Agriculture Student", "কৃষি শিক্ষার্থী")
    fun farmerRole(lang: AppLanguage) = t(lang, "Farmer / Grower", "কৃষক বন্ধু")
    fun moneyManager(lang: AppLanguage) = t(lang, "Student Money Manager", "শিক্ষার্থী মানি ম্যানেজার")
    fun aiAssistant(lang: AppLanguage) = t(lang, "AI Guru", "এআই গুরু")
    fun agriCalculators(lang: AppLanguage) = t(lang, "Agriculture Calculators", "কৃষি ক্যালকুলেটর")
    fun careerPortal(lang: AppLanguage) = t(lang, "Career & Exams", "ক্যারিয়ার ও পরীক্ষা")
    fun communityForum(lang: AppLanguage) = t(lang, "Student Community", "শিক্ষার্থী কমিউনিটি")
    fun adminDashboard(lang: AppLanguage) = t(lang, "Central Admin Dashboard", "সেন্ট্রাল অ্যাডমিন ড্যাশবোর্ড")
    fun meetingZone(lang: AppLanguage) = t(lang, "Meeting Zone", "মিটিং জোন")
    fun doubtZone(lang: AppLanguage) = t(lang, "Doubt Zone", "ডাউট জোন")
    fun doubtZoneFull(lang: AppLanguage) = t(lang, "Doubt Zone – Ask Your Professor", "ডাউট জোন – অধ্যাপককে প্রশ্ন করুন")
    fun whatsappSupport(lang: AppLanguage) = t(lang, "WhatsApp Support", "হোয়াটসঅ্যাপ সহায়তা")
    fun signOut(lang: AppLanguage) = t(lang, "Sign Out", "লগ আউট")
}
