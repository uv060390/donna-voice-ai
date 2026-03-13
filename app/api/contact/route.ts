import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, practice, locations, message } = body;

    if (!name || !email || !practice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/contact]", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
