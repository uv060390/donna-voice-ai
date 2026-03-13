/**
 * Donna Voice AI — Dental Group Cold Outreach Sender
 *
 * Sends email sequence batch via Resend API.
 * Uses prospect CSV from Vibe Prospecting export.
 *
 * Usage:
 *   npx ts-node marketing/email-sequences/send-outreach.ts --batch 50 --sequence 1
 *
 * Env required:
 *   RESEND_API_KEY
 *   OUTREACH_EMAIL (e.g. utkarsh@donna.associates)
 */

import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.OUTREACH_EMAIL || "utkarsh@donna.associates";
const FROM_NAME = "Utkarsh at Donna";
const DELAY_MS = 1200; // ~50 emails/min to stay under rate limits

interface Prospect {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  job_title: string;
  sequence_step?: number;
  last_sent_at?: string;
}

function buildEmail(
  prospect: Prospect,
  step: 1 | 2 | 3
): { subject: string; html: string } {
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
  return {
    subject: tmpl.subject,
    html: wrapHtml(tmpl.body),
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendBatch(prospects: Prospect[], step: 1 | 2 | 3) {
  console.log(`\nSending sequence step ${step} to ${prospects.length} prospects...\n`);

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const p of prospects) {
    const { subject, html } = buildEmail(p, step);

    try {
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM}>`,
        to: p.email,
        subject,
        html,
        tags: [
          { name: "campaign", value: "dental-group-outreach" },
          { name: "sequence_step", value: String(step) },
          { name: "company", value: p.company_name.replace(/[^a-z0-9]/gi, "_").toLowerCase() },
        ],
      });

      if (error) {
        console.error(`✗ ${p.email} — ${error.message}`);
        results.failed++;
        results.errors.push(`${p.email}: ${error.message}`);
      } else {
        console.log(`✓ ${p.first_name} ${p.last_name} <${p.email}> @ ${p.company_name}`);
        results.sent++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${p.email} — ${msg}`);
      results.failed++;
      results.errors.push(`${p.email}: ${msg}`);
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

// Load prospects from JSON file (exported from Vibe Prospecting CSV → JSON)
function loadProspects(filePath: string): Prospect[] {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

// CLI entry
async function main() {
  const args = process.argv.slice(2);
  const batchSize = parseInt(args[args.indexOf("--batch") + 1] || "50");
  const step = parseInt(args[args.indexOf("--sequence") + 1] || "1") as 1 | 2 | 3;
  const file = args[args.indexOf("--file") + 1] || "marketing/email-sequences/prospects.json";

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    process.exit(1);
  }

  let prospects: Prospect[];

  if (fs.existsSync(file)) {
    prospects = loadProspects(file).slice(0, batchSize);
  } else {
    console.error(`Prospects file not found: ${file}`);
    console.log("Please export from Vibe Prospecting and convert to JSON:");
    console.log("  Format: [{first_name, last_name, email, company_name, job_title}]");
    process.exit(1);
  }

  await sendBatch(prospects, step);
}

main().catch(console.error);
