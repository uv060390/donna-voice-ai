# Donna — Dental Group Email Outreach

Cold email campaign targeting decision makers at US dental clinic groups (3–50 locations).

## Files

| File | Description |
|---|---|
| `dental-group-outreach.md` | Full 3-email sequence copy |
| `send-outreach.ts` | Sending script (Resend API) |
| `prospects-sample.json` | Sample verified prospects (4 contacts) |

## Full Prospect List

50 verified contacts exported from Vibe Prospecting:
- Dataset: `us_dental_group_decision_makers_20260313122344`
- View: https://app.vibeprospecting.ai/lists?dataset_id=ds-51104e19-52e7-4741-9f4e-54b4d89e21ae

Download CSV, convert to JSON matching the `prospects-sample.json` schema, save as `prospects.json`.

## Sending

```bash
# Requires: RESEND_API_KEY, OUTREACH_EMAIL env vars

# Send sequence step 1 (cold email) to first 50 prospects
npx ts-node marketing/email-sequences/send-outreach.ts \
  --file marketing/email-sequences/prospects.json \
  --sequence 1 \
  --batch 50

# Follow-up 1 (run 3 days later for non-responders)
npx ts-node marketing/email-sequences/send-outreach.ts \
  --file marketing/email-sequences/prospects.json \
  --sequence 2 \
  --batch 50

# Follow-up 2 (run 10 days after email 1 for non-responders)
npx ts-node marketing/email-sequences/send-outreach.ts \
  --file marketing/email-sequences/prospects.json \
  --sequence 3 \
  --batch 50
```

## ICP

- US dental clinic groups with 3–50 locations
- DSOs (Dental Service Organizations)
- Decision makers: Office Manager, Practice Manager, COO, CEO

## Prospect Research Stats

- **Source:** Vibe Prospecting (LinkedIn category: dentists, US, 2–50 locations)
- **Total found:** 149 contacts with verified emails
- **Exported:** 50 with full contact enrichment
- **Email validity:** All marked `valid` by Vibe Prospecting
