// ============================================================================
// Guru Ji Vision — Secure Server-Side Professor Email Delivery Function
// Deploy on Netlify Functions (/.netlify/functions/send-professor-email)
//
// SECURITY GUARANTEES:
// 1. Recipient Gmail is resolved STRICTLY from the authoritative server-side
//    faculty directory (from ProfessorDirectorySeed.kt). Client-supplied emails
//    are NEVER trusted.
// 2. Requires a valid Firebase Auth ID token (verified against Firebase Auth).
// 3. Prevents duplicate sends per messageId (in-instance idempotency cache).
// 4. All email credentials live exclusively in Netlify Environment Variables
//    (RESEND_API_KEY or BREVO_API_KEY) — NEVER in frontend JavaScript.
// ============================================================================

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyDw01fgwsEdK0AIy8pHwVTy60axkrho2TQ";

// Authoritative professor Gmail registry (exact 7 configured emails from original Android source)
const AUTHORITATIVE_PROFESSOR_EMAILS = {
  prof_anulina_manna: { name: "Dr. Anulina Manna", email: "anuman.lin@gmail.com" },
  prof_sudip_bhattacharya: { name: "Dr. Sudip Bhattacharya", email: "sudipbhattacharya234@gmail.com" },
  prof_pratonu_bandyopadhyay: { name: "Dr. Pratonu Bandyopadhyay", email: "pratonu31@gmail.com" },
  prof_subhas_patar: { name: "Dr. Subhas Patar", email: "subhaspatar@gmail.com" },
  prof_soumyajyoti_das: { name: "Dr. Soumyajyoti Das", email: "soumyasjd@gmail.com" },
  prof_anirban_bhowmik: { name: "Dr. Anirban Bhowmik", email: "bhowmik.anirban1@gmail.com" },
  prof_biswanath_sardar: { name: "Biswanath Sardar", email: "sardarbiswanath8597@gmail.com" }
};

const deliveredMessageIds = new Set();

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") return null;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.users?.[0] || null;
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, status: "FAILED", error: "Method not allowed." });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const authUser = await verifyFirebaseIdToken(idToken);
    if (!authUser) {
      return jsonResponse(401, { ok: false, status: "FAILED", error: "Valid Firebase sign-in is required." });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.professorId || !body.messageId || !body.questionText) {
      return jsonResponse(400, { ok: false, status: "FAILED", error: "Missing required fields (professorId, messageId, questionText)." });
    }

    const prof = AUTHORITATIVE_PROFESSOR_EMAILS[body.professorId];
    if (!prof || !prof.email) {
      return jsonResponse(200, {
        ok: false,
        status: "NOT_CONFIGURED",
        error: "No Gmail address is configured for this advisor in the official directory. Your question is saved safely in the app."
      });
    }

    // Duplicate delivery guard
    const dedupKey = `${body.professorId}:${body.messageId}`;
    if (deliveredMessageIds.has(dedupKey)) {
      return jsonResponse(200, { ok: true, status: "SENT", duplicatePrevented: true });
    }

    const resendKey = process.env.RESEND_API_KEY || "";
    const brevoKey = process.env.BREVO_API_KEY || "";
    const fromEmail = process.env.EMAIL_FROM || "Guru Ji Vision <onboarding@resend.dev>";
    const senderEmailOnly = process.env.EMAIL_FROM_ADDRESS || "noreply@gurujivision.app";
    const siteUrl = String(body.siteUrl || process.env.URL || "https://guru-ji-vision.netlify.app").replace(/\/$/, "");

    if (!resendKey && !brevoKey) {
      return jsonResponse(200, {
        ok: false,
        status: "NOT_CONFIGURED",
        error: "Server email credentials (RESEND_API_KEY or BREVO_API_KEY) are not configured in Netlify Environment Variables yet. Question is saved in Firebase."
      });
    }

    const serviceLabel = body.serviceType === "FARMER_ADVISOR"
      ? "Farmer Advisor Expert (কৃষক পরামর্শ)"
      : "Student Career Guidance (ছাত্র ক্যারিয়ার গাইডেন্স)";
    const submittedAtIst = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });
    const safeTitle = String(body.questionTitle || "New Question").slice(0, 140);
    const safeCategory = String(body.questionCategory || "General").slice(0, 60);
    const safeSenderName = String(body.senderName || authUser.displayName || "Guru Ji Vision User").slice(0, 80);
    const safeContact = String(body.contactInfo || "").slice(0, 80);
    const safeQuestion = String(body.questionText || "").slice(0, 2000);
    const hasAttachment = Boolean(body.hasAttachment);
    const dashboardLink = `${siteUrl}/index.html#professor`;

    const subject = `[Guru Ji Vision • ${serviceLabel}] ${safeTitle}`;
    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:620px;margin:0 auto;border:1px solid #CDE0D3;border-radius:16px;overflow:hidden;background:#ffffff">
        <div style="background:#14532D;color:#ffffff;padding:20px 24px">
          <div style="font-size:12px;letter-spacing:0.5px;text-transform:uppercase;color:#D8F3DC;font-weight:700">${escapeHtml(serviceLabel)}</div>
          <h2 style="margin:6px 0 0;font-size:20px">${escapeHtml(safeTitle)}</h2>
        </div>
        <div style="padding:20px 24px;color:#132219;font-size:14px;line-height:1.6">
          <p style="margin-top:0">Dear <strong>${escapeHtml(prof.name)}</strong>,</p>
          <p>You have received a new question assigned to you on <strong>Guru Ji Vision</strong>:</p>
          <table style="width:100%;border-collapse:collapse;background:#F7F9F5;border:1px solid #CDE0D3;border-radius:10px;margin:14px 0">
            <tr><td style="padding:8px 12px;font-weight:700;width:36%">Submitted By</td><td style="padding:8px 12px">${escapeHtml(safeSenderName)}</td></tr>
            ${safeContact ? `<tr><td style="padding:8px 12px;font-weight:700">Contact (Consented)</td><td style="padding:8px 12px">${escapeHtml(safeContact)}</td></tr>` : ""}
            <tr><td style="padding:8px 12px;font-weight:700">Subject / Category</td><td style="padding:8px 12px">${escapeHtml(safeCategory)}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:700">Attachment</td><td style="padding:8px 12px">${hasAttachment ? "Photo attachment uploaded (view securely inside Guru Ji Vision Professor Dashboard)" : "None"}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:700">Submitted At (IST)</td><td style="padding:8px 12px">${escapeHtml(submittedAtIst)}</td></tr>
          </table>
          <div style="background:#F1F7F2;border-left:4px solid #14532D;padding:12px 16px;border-radius:8px;white-space:pre-line;margin:14px 0">${escapeHtml(safeQuestion)}</div>
          <p style="margin:18px 0">
            <a href="${escapeHtml(dashboardLink)}" style="display:inline-block;background:#14532D;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">
              Open Professor Dashboard to Reply Securely →
            </a>
          </p>
          <p style="font-size:12px;color:#496052;margin-bottom:0">
            For student/farmer privacy, please sign in with your verified faculty account (${escapeHtml(prof.email)}) on Guru Ji Vision so your answer is recorded directly in the user's conversation history.
          </p>
        </div>
      </div>
    `;

    const text = [
      `Guru Ji Vision — ${serviceLabel}`,
      `Assigned Professor: ${prof.name}`,
      `From: ${safeSenderName}`,
      safeContact ? `Contact: ${safeContact}` : null,
      `Category: ${safeCategory}`,
      `Title: ${safeTitle}`,
      `Attachment: ${hasAttachment ? "Photo uploaded inside Guru Ji Vision Professor Dashboard" : "None"}`,
      `Submitted (IST): ${submittedAtIst}`,
      "",
      safeQuestion,
      "",
      `Reply securely in Professor Dashboard: ${dashboardLink}`
    ].filter(Boolean).join("\n");

    let providerOk = false;
    let providerErr = "";

    if (resendKey) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [prof.email],
          subject,
          html,
          text
        })
      });
      if (r.ok) {
        providerOk = true;
      } else {
        const d = await r.json().catch(() => ({}));
        providerErr = d.message || d.error || `Resend HTTP ${r.status}`;
      }
    } else if (brevoKey) {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "Guru Ji Vision", email: senderEmailOnly },
          to: [{ email: prof.email, name: prof.name }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      if (r.ok) {
        providerOk = true;
      } else {
        const d = await r.json().catch(() => ({}));
        providerErr = d.message || `Brevo HTTP ${r.status}`;
      }
    }

    if (!providerOk) {
      return jsonResponse(200, {
        ok: false,
        status: "FAILED",
        error: providerErr || "Email delivery failed. You can retry safely."
      });
    }

    deliveredMessageIds.add(dedupKey);
    return jsonResponse(200, { ok: true, status: "SENT", deliveredAt: new Date().toISOString() });
  } catch (err) {
    return jsonResponse(500, { ok: false, status: "FAILED", error: err?.message || "Unexpected email server error." });
  }
};
