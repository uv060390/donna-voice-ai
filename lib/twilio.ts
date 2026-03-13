import twilio from "twilio";

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send an SMS reminder to a patient
 */
export async function sendSmsReminder({
  to,
  patientName,
  dentistName,
  appointmentDate,
  appointmentTime,
}: {
  to: string;
  patientName: string;
  dentistName: string;
  appointmentDate: string;
  appointmentTime: string;
}) {
  return twilioClient.messages.create({
    body: `Hi ${patientName}! Reminder: You have an appointment with Dr. ${dentistName} on ${appointmentDate} at ${appointmentTime}. Reply CANCEL to cancel or visit ${process.env.NEXTAUTH_URL}/appointments to manage.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}

/**
 * Send an appointment confirmation SMS
 */
export async function sendSmsConfirmation({
  to,
  patientName,
  dentistName,
  appointmentDate,
  appointmentTime,
  confirmationCode,
}: {
  to: string;
  patientName: string;
  dentistName: string;
  appointmentDate: string;
  appointmentTime: string;
  confirmationCode: string;
}) {
  return twilioClient.messages.create({
    body: `DentCall: Your appointment with Dr. ${dentistName} on ${appointmentDate} at ${appointmentTime} is CONFIRMED. Ref: ${confirmationCode}. Manage at ${process.env.NEXTAUTH_URL}/appointments`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}

/**
 * Generate TwiML for inbound call IVR
 * Used in /api/voice/inbound webhook
 */
export function generateInboundIVR(): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: "1",
    action: "/api/voice/menu",
    method: "POST",
    timeout: 10,
  });

  gather.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Welcome to DentCall. Press 1 to book a new appointment. Press 2 to confirm or cancel an existing appointment. Press 3 to speak with a receptionist. Press 0 to repeat this menu."
  );

  // If no input, redirect back
  twiml.redirect("/api/voice/inbound");

  return twiml.toString();
}

/**
 * Generate TwiML for booking confirmation via phone
 */
export function generateBookingConfirmation(
  dentistName: string,
  date: string,
  time: string
): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  twiml.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    `Your appointment with Doctor ${dentistName} has been scheduled for ${date} at ${time}. You will receive a confirmation text shortly. Thank you for choosing DentCall. Goodbye!`
  );

  twiml.hangup();

  return twiml.toString();
}

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
