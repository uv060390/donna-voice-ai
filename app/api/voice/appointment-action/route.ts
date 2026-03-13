import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsConfirmation } from "@/lib/twilio";

/**
 * Handle confirm / cancel action on a looked-up appointment.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const appointmentId = url.searchParams.get("appointmentId") ?? "";
  const phone = url.searchParams.get("phone") ?? "";

  const formData = await req.formData();
  const digit = formData.get("Digits") as string ?? "";

  let twiml = "";

  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { dentist: true, patient: true },
    });

    if (!appt) {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, we couldn't find that appointment. Goodbye.</Say>
  <Hangup/>
</Response>`;
    } else if (digit === "1") {
      // Confirm
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CONFIRMED" },
      });

      const dateStr = new Date(appt.startTime).toLocaleDateString("en-US", {
        month: "long", day: "numeric",
      });
      const timeStr = new Date(appt.startTime).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit",
      });

      // Send confirmation SMS
      if (phone) {
        try {
          await sendSmsConfirmation({
            to: phone,
            dentistName: appt.dentist.firstName + ' ' + appt.dentist.lastName,
            appointmentDate: dateStr,
            appointmentTime: timeStr,
            confirmationCode: appt.id.slice(0, 8).toUpperCase(),
          });
        } catch {
          // non-fatal
        }
      }

      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Your appointment with Doctor ${appt.dentist.firstName + ' ' + appt.dentist.lastName} on ${dateStr} at ${timeStr} has been confirmed.
    A confirmation text has been sent. Thank you! Goodbye.
  </Say>
  <Hangup/>
</Response>`;
    } else if (digit === "2") {
      // Cancel
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED" },
      });

      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Your appointment has been cancelled. We hope to see you soon. Goodbye.
  </Say>
  <Hangup/>
</Response>`;
    } else {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
    }
  } catch {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">An error occurred. Please call back later. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
