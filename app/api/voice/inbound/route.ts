import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInboundIVR } from "@/lib/twilio";

/**
 * @openapi
 * /api/voice/inbound:
 *   post:
 *     summary: Twilio webhook for inbound calls — returns TwiML IVR
 *     tags: [Voice]
 *     description: |
 *       Twilio calls this endpoint when a patient calls the DentCall number.
 *       Returns TwiML that presents an automated IVR menu.
 *       Configure this URL in your Twilio phone number's Voice webhook settings.
 *     requestBody:
 *       description: Twilio call parameters (form-encoded)
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               CallSid:
 *                 type: string
 *               From:
 *                 type: string
 *               To:
 *                 type: string
 *               CallStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: TwiML response
 *         content:
 *           text/xml:
 *             schema:
 *               type: string
 */
export async function POST(req: NextRequest) {
  try {
    // Parse Twilio's form-encoded body
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const callStatus = formData.get("CallStatus") as string;

    // Log the inbound call
    if (callSid) {
      await prisma.callLog.upsert({
        where: { callSid },
        create: {
          callSid,
          fromNumber: from || "unknown",
          toNumber: to || process.env.TWILIO_PHONE_NUMBER || "unknown",
          direction: "INBOUND",
          status: "IN_PROGRESS",
          twilioData: {
            callStatus,
            timestamp: new Date().toISOString(),
          },
        },
        update: {
          status: "IN_PROGRESS",
        },
      });
    }

    // Try to match caller to a patient by phone number
    const patient = from
      ? await prisma.patient.findFirst({
          where: { phone: from },
        })
      : null;

    // Generate IVR TwiML
    const twiml = generateInboundIVR();

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[POST /api/voice/inbound]", error);

    // Always return valid TwiML — Twilio needs this
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, we're experiencing technical difficulties. Please call back later or visit our website to book online. Goodbye.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
