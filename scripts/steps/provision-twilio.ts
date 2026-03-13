import Twilio from "twilio";
import { ClientConfig } from "../types/ClientConfig";
import { logger } from "../utils/logger";

export interface TwilioResult {
  twilioPhoneNumber: string;
  twilioPhoneSid: string;
}

export async function provisionTwilio(config: ClientConfig): Promise<TwilioResult> {
  // Idempotent: skip if already provisioned
  if (config.provisioned?.twilioPhoneSid) {
    logger.skip(`Twilio already provisioned (${config.provisioned.twilioPhoneNumber})`);
    return {
      twilioPhoneNumber: config.provisioned.twilioPhoneNumber!,
      twilioPhoneSid: config.provisioned.twilioPhoneSid,
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars required");
  }

  const client = Twilio(accountSid, authToken);
  const voiceUrl = `https://${config.clientId}.up.railway.app/api/voice/inbound`;

  logger.step(`Searching for available local number in area code ${config.areaCode}...`);
  const available = await client.availablePhoneNumbers("US").local.list({
    areaCode: parseInt(config.areaCode, 10),
    voiceEnabled: true,
    limit: 5,
  });

  if (available.length === 0) {
    throw new Error(
      `No available local numbers in area code ${config.areaCode}. Try a nearby area code.`
    );
  }

  const chosen = available[0];
  logger.info(`Found: ${chosen.phoneNumber} — purchasing...`);

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: chosen.phoneNumber,
    voiceUrl,
    voiceMethod: "POST",
    friendlyName: `Donna - ${config.name}`,
  });

  logger.success(`Purchased ${purchased.phoneNumber} (SID: ${purchased.sid})`);

  return {
    twilioPhoneNumber: purchased.phoneNumber,
    twilioPhoneSid: purchased.sid,
  };
}
