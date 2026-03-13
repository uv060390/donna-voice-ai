import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

function saveLead(lead: Record<string, unknown>) {
  try {
    const dir = path.join(process.cwd(), "data");
    const file = path.join(dir, "demo-leads.json");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
    existing.push({ ...lead, submittedAt: new Date().toISOString() });
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error("[contact] lead save failed:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, practice, locations, message } = body;

    if (!name || !email || !practice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lead = { name, email, practice, locations, message };

    // Always save lead to disk first as durable fallback
    saveLead(lead);

    // Try Resend — will fail gracefully if domain not yet verified
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Donna Associates <noreply@donna.associates>",
        to: "utkarsh@donna.associates",
        subject: `New demo request: ${practice}`,
        html: `
          <h2>New demo request from donna.associates</h2>
          <table cellpadding="8" style="border-collapse:collapse">
            <tr><td><strong>Name</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Practice</strong></td><td>${practice}</td></tr>
            <tr><td><strong>Locations</strong></td><td>${locations || "Not specified"}</td></tr>
            <tr><td><strong>Message</strong></td><td>${message || "—"}</td></tr>
          </table>
        `,
        replyTo: email,
      });
    } catch (resendErr) {
      // Domain not verified or Resend error — lead is already saved to data/demo-leads.json
      console.warn("[contact] Resend skipped, lead saved to data/demo-leads.json:", resendErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/contact]", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
