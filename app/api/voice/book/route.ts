import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsConfirmation } from "@/lib/twilio";

/**
 * Booking flow — multi-step IVR to collect patient info and book an appointment.
 *
 * State is passed via URL query params:
 *   step=name   → collect patient name (via speech/keypad)
 *   step=date   → collect preferred date (MM/DD)
 *   step=time   → collect preferred time (HHMM)
 *   step=confirm → read back details and confirm (1=yes, 2=no)
 *
 * Data accumulates in query params: name, date, time, dentistId
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const step = url.searchParams.get("step") ?? "name";
  const from = url.searchParams.get("from") ?? "";
  const patientName = url.searchParams.get("name") ?? "";
  const preferredDate = url.searchParams.get("date") ?? "";
  const preferredTime = url.searchParams.get("time") ?? "";
  const dentistId = url.searchParams.get("dentistId") ?? "";

  const formData = await req.formData();
  const digits = formData.get("Digits") as string ?? "";
  const speechResult = formData.get("SpeechResult") as string ?? "";
  const callerFrom = formData.get("From") as string ?? from;

  let twiml = "";

  switch (step) {
    case "name": {
      const nameInput = speechResult || digits;
      if (!nameInput) {
        twiml = gatherSpeech(
          "/api/voice/book?step=name",
          "Please say your full name after the tone.",
          true
        );
      } else {
        const nextUrl = buildUrl("/api/voice/book", {
          step: "date",
          from: callerFrom,
          name: nameInput,
          dentistId,
        });
        twiml = gatherDigits(
          nextUrl,
          `Got it, ${nameInput}. Please enter your preferred appointment date as month and day. For example, press 0312 for March 12th.`,
          4
        );
      }
      break;
    }

    case "date": {
      if (!digits || digits.length < 3) {
        twiml = gatherDigits(
          buildUrl("/api/voice/book", { step: "date", from: callerFrom, name: patientName, dentistId }),
          "Please enter your preferred date as 4 digits: month then day. For example, 0312 for March 12th.",
          4
        );
      } else {
        const nextUrl = buildUrl("/api/voice/book", {
          step: "time",
          from: callerFrom,
          name: patientName,
          date: digits,
          dentistId,
        });
        twiml = gatherDigits(
          nextUrl,
          "Now enter your preferred time as 4 digits in 24-hour format. For example, 0900 for 9 AM or 1400 for 2 PM.",
          4
        );
      }
      break;
    }

    case "time": {
      if (!digits || digits.length < 3) {
        twiml = gatherDigits(
          buildUrl("/api/voice/book", { step: "time", from: callerFrom, name: patientName, date: preferredDate, dentistId }),
          "Please enter a 4-digit time in 24-hour format, such as 0900 for 9 AM.",
          4
        );
      } else {
        const hour = parseInt(digits.slice(0, 2), 10);
        const minute = parseInt(digits.slice(2, 4), 10);
        const monthNum = parseInt(preferredDate.slice(0, 2), 10);
        const dayNum = parseInt(preferredDate.slice(2, 4), 10);

        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const monthName = monthNames[monthNum - 1] ?? "unknown";
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

        const confirmUrl = buildUrl("/api/voice/book", {
          step: "confirm",
          from: callerFrom,
          name: patientName,
          date: preferredDate,
          time: digits,
          dentistId,
        });
        twiml = gatherDigits(
          confirmUrl,
          `I have: ${patientName}, ${monthName} ${dayNum}, at ${hour12}:${String(minute).padStart(2, "0")} ${ampm}. Press 1 to confirm, or press 2 to start over.`,
          1
        );
      }
      break;
    }

    case "confirm": {
      if (digits === "1") {
        // Book the appointment
        try {
          const result = await bookAppointment({
            callerPhone: callerFrom,
            patientName,
            preferredDate,
            preferredTime,
            dentistId,
          });

          if (result.success) {
            // Send SMS confirmation
            if (callerFrom && callerFrom !== "unknown") {
              try {
                await sendSmsConfirmation({
                  to: callerFrom,
                  dentistName: result.dentistName ?? "your dentist",
                  appointmentDate: result.dateDisplay ?? preferredDate,
                  appointmentTime: result.timeDisplay ?? preferredTime,
                  confirmationCode: result.confirmationCode ?? "N/A",
                });
              } catch {
                // SMS failure shouldn't fail the whole call
              }
            }

            twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Your appointment has been booked! You'll receive a confirmation text shortly.
    Your confirmation code is ${result.confirmationCode}. Thank you for calling. Goodbye!
  </Say>
  <Hangup/>
</Response>`;
          } else {
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    I'm sorry, we couldn't find an available slot for that time. Please call back during business hours or visit our website to book online. Goodbye.
  </Say>
  <Hangup/>
</Response>`;
          }
        } catch {
          twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    We're sorry, there was a technical issue. Please call back during business hours. Goodbye.
  </Say>
  <Hangup/>
</Response>`;
        }
      } else {
        // Restart
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
      }
      break;
    }

    default: {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
    }
  }

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

// ── helpers ────────────────────────────────────────────────

function gatherSpeech(action: string, prompt: string, enhanced = false): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${action}" method="POST" speechTimeout="auto" enhanced="${enhanced}">
    <Say voice="Polly.Joanna">${prompt}</Say>
  </Gather>
  <Redirect>${action}</Redirect>
</Response>`;
}

function gatherDigits(action: string, prompt: string, numDigits: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="${numDigits}" action="${action}" method="POST" timeout="15">
    <Say voice="Polly.Joanna">${prompt}</Say>
  </Gather>
  <Say voice="Polly.Joanna">We didn't receive input. Let's try again.</Say>
  <Redirect>${action}</Redirect>
</Response>`;
}

function buildUrl(base: string, params: Record<string, string>): string {
  const q = new URLSearchParams(params).toString();
  return `${base}?${q}`;
}

async function bookAppointment({
  callerPhone,
  patientName,
  preferredDate,
  preferredTime,
  dentistId,
}: {
  callerPhone: string;
  patientName: string;
  preferredDate: string; // MMDD
  preferredTime: string; // HHMM
  dentistId: string;
}) {
  const year = new Date().getFullYear();
  const month = preferredDate.slice(0, 2);
  const day = preferredDate.slice(2, 4);
  const hour = preferredTime.slice(0, 2);
  const minute = preferredTime.slice(2, 4);

  const startTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);

  // Find or create patient by phone
  let patient = await prisma.patient.findFirst({ where: { phone: callerPhone } });
  if (!patient) {
    const nameParts = patientName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "Voice";
    const lastName = nameParts.slice(1).join(" ") || "Patient";
    const phoneDigits = callerPhone.replace(/\D/g, "");
    const voiceEmail = `${phoneDigits}@voice.dentcall.io`;

    // Patient requires a User — create a stub user for voice-booked patients
    const user = await prisma.user.upsert({
      where: { email: voiceEmail },
      create: { email: voiceEmail, name: patientName, role: "PATIENT" },
      update: {},
    });

    patient = await prisma.patient.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        phone: callerPhone,
        email: voiceEmail,
      },
    });
  }

  // Find available slot near requested time
  const slotEnd = new Date(startTime.getTime() + 60 * 60 * 1000);
  const slot = await prisma.availabilitySlot.findFirst({
    where: {
      dentistId: dentistId || undefined,
      isBooked: false,
      isBlocked: false,
      startTime: { gte: startTime, lte: slotEnd },
    },
    include: { dentist: true },
  });

  const dentist = slot?.dentist ?? (dentistId
    ? await prisma.dentist.findUnique({ where: { id: dentistId } })
    : null);

  if (!dentist) {
    return { success: false };
  }

  // Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      dentistId: dentist.id,
      patientId: patient.id,
      slotId: slot?.id ?? null,
      startTime,
      endTime: new Date(startTime.getTime() + 60 * 60 * 1000), // 1-hour slot
      type: "GENERAL_CHECKUP",
      status: "CONFIRMED",
      notes: `Booked via phone IVR. Caller: ${callerPhone}`,
    },
  });

  // Mark slot as taken
  if (slot) {
    await prisma.availabilitySlot.update({
      where: { id: slot.id },
      data: { isBooked: true },
    });
  }

  const confirmationCode = appointment.id.slice(0, 8).toUpperCase();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateDisplay = `${monthNames[startTime.getMonth()]} ${startTime.getDate()}`;
  const timeDisplay = startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return {
    success: true,
    confirmationCode,
    dentistName: `${dentist.firstName} ${dentist.lastName}`,
    dateDisplay,
    timeDisplay,
  };
}
