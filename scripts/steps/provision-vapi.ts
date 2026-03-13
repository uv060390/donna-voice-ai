import { ClientConfig } from "../types/ClientConfig";
import { logger } from "../utils/logger";

export interface VapiResult {
  vapiAssistantId: string;
  vapiPhoneNumberId: string;
}

function buildSystemPrompt(config: ClientConfig): string {
  const hours = Object.entries(config.hours)
    .map(([day, h]) => {
      if (!h || h.open === null) return `${day}: Closed`;
      return `${day}: ${h.open} – ${h.close}`;
    })
    .join("\n");

  return `You are the AI receptionist for ${config.name}, a dental practice located in ${config.city}, ${config.state}.

Your job is to help patients schedule, confirm, or cancel appointments over the phone.

Practice phone: ${config.practicePhone}
Office hours:
${hours}

When scheduling:
1. Ask for patient name, date of birth, and contact phone number
2. Ask for preferred day/time
3. Confirm the appointment details before finalizing
4. Always be friendly, professional, and concise

If the patient has a dental emergency, direct them to call 911 or visit the nearest ER.
If you cannot help, offer to transfer to the front desk at ${config.practicePhone}.`;
}

export async function provisionVapi(
  config: ClientConfig,
  twilioPhoneNumber: string
): Promise<VapiResult> {
  // Idempotent: skip if already provisioned
  if (config.provisioned?.vapiAssistantId) {
    logger.skip(`VAPI already provisioned (assistant: ${config.provisioned.vapiAssistantId})`);
    return {
      vapiAssistantId: config.provisioned.vapiAssistantId,
      vapiPhoneNumberId: config.provisioned.vapiPhoneNumberId!,
    };
  }

  const vapiKey = process.env.VAPI_API_KEY;
  if (!vapiKey) {
    throw new Error("VAPI_API_KEY env var required");
  }

  const headers = {
    Authorization: `Bearer ${vapiKey}`,
    "Content-Type": "application/json",
  };

  logger.step("Creating VAPI assistant...");
  const assistantRes = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: `Donna - ${config.name}`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt: buildSystemPrompt(config),
        temperature: 0.3,
      },
      voice: {
        provider: "11labs",
        voiceId: "rachel",
      },
      firstMessage: `Thank you for calling ${config.name}. This is Donna, your AI scheduling assistant. How can I help you today?`,
      endCallMessage: "Thank you for calling. Have a great day!",
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
    }),
  });

  if (!assistantRes.ok) {
    const err = await assistantRes.text();
    throw new Error(`VAPI assistant creation failed: ${assistantRes.status} ${err}`);
  }

  const assistant = await assistantRes.json();
  logger.success(`VAPI assistant created: ${assistant.id}`);

  // Import Twilio number into VAPI
  logger.step(`Importing Twilio number ${twilioPhoneNumber} into VAPI...`);
  const phoneRes = await fetch("https://api.vapi.ai/phone-number", {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: "twilio",
      number: twilioPhoneNumber,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      assistantId: assistant.id,
      name: `Donna - ${config.name}`,
    }),
  });

  if (!phoneRes.ok) {
    const err = await phoneRes.text();
    throw new Error(`VAPI phone number import failed: ${phoneRes.status} ${err}`);
  }

  const phone = await phoneRes.json();
  logger.success(`Twilio number imported into VAPI: ${phone.id}`);

  return {
    vapiAssistantId: assistant.id,
    vapiPhoneNumberId: phone.id,
  };
}
