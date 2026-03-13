import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Look up upcoming appointments by phone number.
 * Called after patient enters their 10-digit phone number in the IVR.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const digits = formData.get("Digits") as string ?? "";
  const callerFrom = formData.get("From") as string ?? "";

  // Normalize phone: strip non-digits, add +1 prefix
  const rawDigits = digits.replace(/\D/g, "");
  const phone = rawDigits.length === 10 ? `+1${rawDigits}` : `+${rawDigits}`;

  let twiml = "";

  try {
    const patient = await prisma.patient.findFirst({ where: { phone } });

    if (!patient) {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    We couldn't find an account with that phone number.
    If you'd like to book a new appointment, press 1, or press 2 to return to the main menu.
  </Say>
  <Gather numDigits="1" action="/api/voice/menu" method="POST" timeout="10">
    <Say voice="Polly.Joanna"></Say>
  </Gather>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
    } else {
      const appointments = await prisma.appointment.findMany({
        where: {
          patientId: patient.id,
          startTime: { gte: new Date() },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        include: { dentist: true },
        orderBy: { startTime: "asc" },
        take: 3,
      });

      if (appointments.length === 0) {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    You have no upcoming appointments. Would you like to book one? Press 1 to book, or press 2 to return to the main menu.
  </Say>
  <Gather numDigits="1" action="/api/voice/menu" method="POST" timeout="10">
    <Say voice="Polly.Joanna"></Say>
  </Gather>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
      } else {
        const appt = appointments[0];
        const dateStr = new Date(appt.startTime).toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric",
        });
        const timeStr = new Date(appt.startTime).toLocaleTimeString("en-US", {
          hour: "numeric", minute: "2-digit",
        });

        const actionUrl = `/api/voice/appointment-action?appointmentId=${appt.id}&phone=${encodeURIComponent(phone)}&from=${encodeURIComponent(callerFrom)}`;

        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${actionUrl}" method="POST" timeout="15">
    <Say voice="Polly.Joanna">
      We found your appointment with Doctor ${appt.dentist.firstName + ' ' + appt.dentist.lastName} on ${dateStr} at ${timeStr}.
      Press 1 to confirm this appointment. Press 2 to cancel it. Press 3 to return to the main menu.
    </Say>
  </Gather>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
      }
    }
  } catch {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, there was a technical issue. Please call back later. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
