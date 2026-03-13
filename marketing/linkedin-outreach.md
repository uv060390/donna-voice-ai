# Donna — LinkedIn Direct Outreach Templates

**Target:** Decision makers at US dental clinic groups (3–20 locations)
**From:** Utkarsh (Donna Associates)
**Goal:** Book a 15-minute demo call

These templates are for manual LinkedIn DM or Sales Navigator outreach to the 149 prospects in `email-sequences/prospects.json`.

---

## DM Template 1 — Cold Connection Request Note

*(Use as the "Add a note" message with a connection request — 300 char max)*

```
Hi {{first_name}} — I work with dental groups on AI-powered call answering that books appointments 24/7 into their PMS. Seeing great results with groups like {{company_name}}. Would love to connect and share a quick demo.
```

---

## DM Template 2 — Cold DM (Already Connected)

*(Send after connection is accepted, or if already connected)*

**Subject line (if InMail):** How {{company_name}} can stop missing calls after hours

```
Hi {{first_name}},

Quick question — how does {{company_name}} handle inbound calls after hours or when your front desk is slammed?

I'm working with dental groups on a voice AI receptionist called Donna that answers every call 24/7 and books appointments directly into their PMS (Dentrix, Eaglesoft, OpenDental, etc.). No hold times, no missed patients.

A 5-location group pays $1,795/month. Their front desk FTE cost alone was $45k/year — so the ROI math is pretty easy.

Would a 15-minute demo be worth your time? Happy to show you a live call example.

— Utkarsh
Donna Associates | donna.associates
```

---

## DM Template 3 — Follow-Up (5 days after DM 2, no reply)

```
Hi {{first_name}},

Just following up on my note from earlier this week.

One thing that usually catches people's attention: the average missed call at a multi-location dental group costs $200–$800 in lost revenue. Donna pays for itself by recovering a fraction of those calls.

If it's not a fit right now, no worries at all. But if front desk capacity or missed calls ever comes up in your ops reviews, I'd love to show you what we've built.

Would a 10-minute call work this week?

— Utkarsh
```

---

## DM Template 4 — CEO/C-Suite Variant (Shorter, ROI-focused)

*(For CEOs, COOs, Founders — shorter and more direct)*

```
Hi {{first_name}},

I run a company called Donna Associates. We build voice AI for dental groups that answers every call 24/7 and books into your PMS automatically.

Most DSOs we work with see immediate ROI — Donna covers all phone scheduling at a fraction of a single front desk hire. Setup in days.

Worth a 15-minute demo?

— Utkarsh | donna.associates
```

---

## DM Template 5 — Office Manager / Ops Variant (Empathy-led)

*(For Office Managers, Practice Managers, Ops Directors — lead with pain)*

```
Hi {{first_name}},

I know office managers at multi-location groups deal with a lot — staffing, scheduling, patients on hold, calls going to voicemail after hours.

We built Donna specifically for this: a voice AI that handles all inbound appointment calls 24/7 and books directly into your practice management system. Your team focuses on the patients in the building.

Would love to show you how it works in a quick 15-minute call. Worth it?

— Utkarsh | donna.associates
```

---

## Personalization Variables

| Variable | Source |
|---|---|
| `{{first_name}}` | `prospects.json` → `first_name` |
| `{{company_name}}` | `prospects.json` → `company_name` |
| `{{job_title}}` | `prospects.json` → `job_title` |

---

## Outreach Sequence

1. **Day 0** — Send connection request with Template 1 note
2. **Day 1–2** — If accepted, send Template 2 (Cold DM)
   - Use Template 4 for C-suite (CEO/COO/Founder)
   - Use Template 5 for ops/office manager roles
3. **Day 5–7** — If no reply, send Template 3 (Follow-Up)
4. **Day 14** — If still no reply, move to email sequence (DON-11)

---

## Volume & Tracking

- Target: 20–30 LinkedIn DMs per day (avoid LinkedIn spam limits)
- Log connections and replies in `marketing/linkedin-outreach-log.csv`
- Any positive reply → create a subtask in Paperclip for CEO follow-up

---

## Booking Link

Include a Calendly or booking link in all DMs once available.
**Placeholder:** Add booking URL to `donna.associates` once set up by board.

---

*Donna Associates | utkarsh@donna.associates | donna.associates*
