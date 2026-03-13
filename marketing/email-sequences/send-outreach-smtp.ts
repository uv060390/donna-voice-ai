/**
 * Donna Voice AI — Dental Group Cold Outreach Sender (SMTP / Gmail)
 *
 * Sends email sequence via Gmail SMTP using nodemailer.
 * Bypasses Resend domain verification requirement.
 *
 * Usage:
 *   npx ts-node marketing/email-sequences/send-outreach-smtp.ts --batch 50 --sequence 1
 *   npx ts-node marketing/email-sequences/send-outreach-smtp.ts --test  (sends 1 email to self)
 *
 * Env required:
 *   OUTREACH_EMAIL       (e.g. utkarsh@donna.associates)
 *   OUTREACH_EMAIL_PASSWORD
 */

import * as nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";

const FROM_EMAIL = process.env.OUTREACH_EMAIL || "utkarsh@donna.associates";
const FROM_PASS = process.env.OUTREACH_EMAIL_PASSWORD || "";
const FROM_NAME = "Utkarsh at Donna";
const DELAY_MS = 1500; // ~40 emails/min

interface Prospect {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  job_title: string;
  sequence_step?: number;
  last_sent_at?: string;
}

function createTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: FROM_EMAIL,
      pass: FROM_PASS,
    },
  });
}

function buildEmail(
  prospect: Prospect,
  step: 1 | 2 | 3
): { subject: string; html: string; text: string } {
  const { first_name, company_name } = prospect;

  const personalize = (text: string) =>
    text
      .replace(/{{first_name}}/g, first_name)
      .replace(/{{company_name}}/g, company_name);

  const wrapHtml = (text: string) =>
    `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">${text
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("")}</div>`;

  const templates: Record<1 | 2 | 3, { subject: string; body: string }> = {
    1: {
      subject: `${first_name}, how many calls does ${company_name} miss per day?`,
      body: personalize(`Hi {{first_name}},

Quick question — how many calls does your front desk miss each week at {{company_name}}?

At multi-location dental groups, it's usually more than anyone wants to admit. After-hours calls, hold times, staff calling in sick — every missed call is a missed appointment.

Donna is a voice AI that answers every inbound call 24/7 and books appointments directly into your practice management system. No hold times, no missed calls, no extra headcount.

- Setup in days, not months
- Works across all your locations
- Fixed cost: $299/location/month (all calls included)

Happy to show you a 15-minute demo. Would next week work?

Best,
Utkarsh
Donna Associates
utkarsh@donna.associates`),
    },
    2: {
      subject: `Re: ${company_name} — one thing that might help`,
      body: personalize(`Hi {{first_name}},

Following up on my note from earlier this week.

One thing worth knowing: the average multi-location dental group spends $35–50k/year per front desk FTE on scheduling calls alone. Donna handles all of that at a fraction of the cost — and unlike a front desk employee, she never calls in sick or puts a patient on hold.

If you're open to a quick 15-minute call, I can show you exactly how it works for groups like yours.

Just reply and I'll send a calendar link.

Utkarsh
Donna Associates`),
    },
    3: {
      subject: `Last note — Donna for ${company_name}`,
      body: personalize(`Hi {{first_name}},

I'll keep this short — I know your inbox is busy.

We work specifically with dental groups like {{company_name}} to make sure every patient call gets answered and booked, even at 11pm on a Sunday.

If the timing isn't right now, no worries at all. But if missed calls or front desk capacity is ever on your mind, I'd love to connect.

Happy to send over a quick overview or jump on a 10-minute call — whatever's easier.

Utkarsh
Donna Associates
utkarsh@donna.associates`),
    },
  };

  const tmpl = templates[step];
  const bodyText = tmpl.body;
  return {
    subject: tmpl.subject,
    html: wrapHtml(bodyText),
    text: bodyText,
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendBatch(
  transport: nodemailer.Transporter,
  prospects: Prospect[],
  step: 1 | 2 | 3
) {
  console.log(`\nSending sequence step ${step} to ${prospects.length} prospects...\n`);

  const results: {
    sent: number;
    failed: number;
    errors: string[];
    log: Array<{ email: string; name: string; company: string; status: string; error?: string; timestamp: string }>;
  } = { sent: 0, failed: 0, errors: [], log: [] };

  for (const p of prospects) {
    const { subject, html, text } = buildEmail(p, step);
    const timestamp = new Date().toISOString();

    try {
      await transport.sendMail({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: `${p.first_name} ${p.last_name} <${p.email}>`,
        subject,
        html,
        text,
      });

      console.log(`✓ ${p.first_name} ${p.last_name} <${p.email}> @ ${p.company_name}`);
      results.sent++;
      results.log.push({ email: p.email, name: `${p.first_name} ${p.last_name}`, company: p.company_name, status: "sent", timestamp });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${p.email} — ${msg}`);
      results.failed++;
      results.errors.push(`${p.email}: ${msg}`);
      results.log.push({ email: p.email, name: `${p.first_name} ${p.last_name}`, company: p.company_name, status: "failed", error: msg, timestamp });
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n--- Results ---`);
  console.log(`Sent:   ${results.sent}`);
  console.log(`Failed: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log(`\nErrors:`);
    results.errors.forEach((e) => console.log(`  ${e}`));
  }

  return results;
}

function loadProspects(filePath: string): Prospect[] {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes("--test");
  const batchIdx = args.indexOf("--batch");
  const stepIdx = args.indexOf("--sequence");
  const fileIdx = args.indexOf("--file");

  const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1] || "50") : 50;
  const step = (stepIdx !== -1 ? parseInt(args[stepIdx + 1] || "1") : 1) as 1 | 2 | 3;
  const file =
    fileIdx !== -1
      ? args[fileIdx + 1]
      : "marketing/email-sequences/prospects.json";

  if (!FROM_PASS) {
    console.error("OUTREACH_EMAIL_PASSWORD not set");
    process.exit(1);
  }

  const transport = createTransport();

  // Verify connection
  console.log("Verifying SMTP connection...");
  try {
    await transport.verify();
    console.log("✓ SMTP connection verified\n");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ SMTP connection failed: ${msg}`);
    process.exit(1);
  }

  if (isTest) {
    // Send a single test email to self
    const testProspect: Prospect = {
      first_name: "Utkarsh",
      last_name: "Vaibhav",
      email: FROM_EMAIL,
      company_name: "Donna Test",
      job_title: "CEO",
    };
    console.log("Sending test email to self...");
    const results = await sendBatch(transport, [testProspect], 1);
    console.log("\nTest complete.");
    return;
  }

  let prospects: Prospect[];
  if (fs.existsSync(file)) {
    prospects = loadProspects(file).slice(0, batchSize);
  } else {
    console.error(`Prospects file not found: ${file}`);
    process.exit(1);
  }

  const results = await sendBatch(transport, prospects, step);

  // Write send log
  const logDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const logPath = `marketing/email-sequences/send-log-smtp-${logDate}.json`;
  fs.writeFileSync(
    logPath,
    JSON.stringify({ runAt: new Date().toISOString(), step, sent: results.sent, failed: results.failed, log: results.log }, null, 2)
  );
  console.log(`\nLog written to ${logPath}`);
}

main().catch(console.error);
