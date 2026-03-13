import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/voice/menu:
 *   post:
 *     summary: Handle IVR menu digit selection
 *     tags: [Voice]
 *     description: |
 *       Called by Twilio after the caller presses a digit in the IVR menu.
 *       Routes to the appropriate sub-flow.
 *     responses:
 *       200:
 *         description: TwiML response for the selected option
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const digit = formData.get("Digits") as string;
    const callSid = formData.get("CallSid") as string;

    let twiml = "";

    switch (digit) {
      case "1":
        // Book new appointment — hand off to AI or collect info
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    To book a new appointment online, please visit our website at dentcall.io and use our booking tool.
    Alternatively, stay on the line and a receptionist will assist you shortly.
  </Say>
  <Gather numDigits="1" action="/api/voice/book" method="POST" timeout="10">
    <Say voice="Polly.Joanna">Press 1 to hold for a receptionist, or press 2 to return to the main menu.</Say>
  </Gather>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
        break;

      case "2":
        // Confirm or cancel existing appointment
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="10" action="/api/voice/appointment-lookup" method="POST" timeout="15">
    <Say voice="Polly.Joanna">
      Please enter your 10-digit phone number to look up your appointment.
    </Say>
  </Gather>
  <Say voice="Polly.Joanna">We didn't receive your input. Please try again.</Say>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
        break;

      case "3":
        // Transfer to receptionist
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Please hold while we connect you to our team.</Say>
  <Dial timeout="30" callerId="${process.env.TWILIO_PHONE_NUMBER || "+10000000000"}">
    <Number>${process.env.CLINIC_MAIN_NUMBER || "+10000000000"}</Number>
  </Dial>
  <Say voice="Polly.Joanna">We're sorry, no one is available right now. Please call back during business hours. Goodbye.</Say>
  <Hangup/>
</Response>`;
        break;

      case "0":
      default:
        // Repeat menu
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;
        break;
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[POST /api/voice/menu]", error);

    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">An error occurred. Goodbye.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(fallback, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
