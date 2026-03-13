#!/usr/bin/env npx ts-node --esm
import fs from "fs";
import path from "path";
import { parseClientConfig, ClientConfig } from "./types/ClientConfig";
import { provisionTwilio } from "./steps/provision-twilio";
import { provisionVapi } from "./steps/provision-vapi";
import { provisionRailway } from "./steps/provision-railway";
import { logger } from "./utils/logger";

function saveProvisioned(configPath: string, config: ClientConfig) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error("Usage: ts-node scripts/deploy-client.ts <path/to/client.json>");
    process.exit(1);
  }

  const absPath = path.resolve(configPath);
  const raw = JSON.parse(fs.readFileSync(absPath, "utf-8"));
  const config = parseClientConfig(raw);

  console.log(`\n🦷  Donna — Deploying client: ${config.name} (${config.clientId})\n`);

  // Step 1: Twilio phone number
  logger.step("[1/3] Provisioning Twilio phone number");
  const twilioResult = await provisionTwilio(config);
  config.provisioned = { ...config.provisioned, ...twilioResult };
  saveProvisioned(absPath, config);

  // Step 2: VAPI voice assistant
  logger.step("[2/3] Provisioning VAPI assistant");
  const vapiResult = await provisionVapi(config, twilioResult.twilioPhoneNumber);
  config.provisioned = { ...config.provisioned, ...vapiResult };
  saveProvisioned(absPath, config);

  // Step 3: Railway deployment
  logger.step("[3/3] Provisioning Railway deployment");
  const railwayEnvVars: Record<string, string> = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
    VAPI_API_KEY: process.env.VAPI_API_KEY ?? "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
    TWILIO_PHONE_NUMBER: twilioResult.twilioPhoneNumber,
    VAPI_ASSISTANT_ID: vapiResult.vapiAssistantId,
  };
  const railwayResult = await provisionRailway(config, railwayEnvVars);
  config.provisioned = {
    ...config.provisioned,
    ...railwayResult,
    provisionedAt: new Date().toISOString(),
  };
  saveProvisioned(absPath, config);

  console.log(`\n✅  ${config.name} is live!\n`);
  console.log(`   Phone:  ${twilioResult.twilioPhoneNumber}`);
  console.log(`   URL:    ${railwayResult.deployedUrl}`);
  console.log(`   Config: ${absPath}\n`);
}

main().catch((err) => {
  logger.error(String(err));
  process.exit(1);
});
