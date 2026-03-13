#!/usr/bin/env npx ts-node --esm
import fs from "fs";
import path from "path";
import Twilio from "twilio";
import { parseClientConfig } from "./types/ClientConfig";
import { logger } from "./utils/logger";

const RAILWAY_API = "https://backboard.railway.app/graphql/v2";

async function railwayGql(query: string, variables: Record<string, unknown>, token: string) {
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Railway API error: ${res.status} ${await res.text()}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(`Railway GraphQL error: ${JSON.stringify(errors)}`);
  return data;
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error("Usage: ts-node scripts/destroy-client.ts <path/to/client.json>");
    process.exit(1);
  }

  const absPath = path.resolve(configPath);
  const raw = JSON.parse(fs.readFileSync(absPath, "utf-8"));
  const config = parseClientConfig(raw);
  const p = config.provisioned;

  if (!p) {
    logger.warn("No provisioned state found — nothing to destroy.");
    process.exit(0);
  }

  console.log(`\n🗑️   Donna — Destroying client: ${config.name} (${config.clientId})\n`);

  // Release Twilio number
  if (p.twilioPhoneSid) {
    logger.step("Releasing Twilio phone number...");
    try {
      const twilioClient = Twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );
      await twilioClient.incomingPhoneNumbers(p.twilioPhoneSid).remove();
      logger.success(`Released ${p.twilioPhoneNumber}`);
    } catch (err) {
      logger.warn(`Twilio release failed (may already be released): ${err}`);
    }
  }

  // Delete VAPI assistant
  if (p.vapiAssistantId) {
    logger.step("Deleting VAPI assistant...");
    try {
      // Delete phone number first
      if (p.vapiPhoneNumberId) {
        await fetch(`https://api.vapi.ai/phone-number/${p.vapiPhoneNumberId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
        });
      }
      await fetch(`https://api.vapi.ai/assistant/${p.vapiAssistantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
      });
      logger.success(`Deleted VAPI assistant ${p.vapiAssistantId}`);
    } catch (err) {
      logger.warn(`VAPI deletion failed: ${err}`);
    }
  }

  // Delete Railway project
  if (p.railwayProjectId) {
    logger.step("Deleting Railway project...");
    try {
      await railwayGql(
        `mutation($id: String!) { projectDelete(id: $id) }`,
        { id: p.railwayProjectId },
        process.env.RAILWAY_API_TOKEN!
      );
      logger.success(`Deleted Railway project ${p.railwayProjectId}`);
    } catch (err) {
      logger.warn(`Railway deletion failed: ${err}`);
    }
  }

  // Clear provisioned fields from config
  config.provisioned = undefined;
  fs.writeFileSync(absPath, JSON.stringify(config, null, 2) + "\n");
  logger.success("Cleared provisioned fields from config file");

  console.log(`\n✅  ${config.name} destroyed.\n`);
}

main().catch((err) => {
  logger.error(String(err));
  process.exit(1);
});
