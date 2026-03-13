# Donna — Demo to Close Cadence

Playbook for converting a booked demo into a paying client.

---

## Stage 1 — Demo Booked (Day 0)

**Trigger:** Prospect books a call via Calendly/booking link or replies positively to LinkedIn/email.

**Actions:**
- [ ] Send calendar invite with video link (Zoom/Meet)
- [ ] Send confirmation email:

```
Subject: Your Donna demo — [Date/Time]

Hi {{first_name}},

Confirmed — looking forward to showing you Donna on [DATE] at [TIME].

A few things that'll make the demo most useful:
- How many locations does {{company_name}} have?
- What PMS do you use? (Dentrix, Eaglesoft, OpenDental, etc.)
- What's your biggest front desk pain right now — missed calls, after-hours coverage, staffing?

See you then.

— Utkarsh
Donna Associates | donna.associates
```

---

## Stage 2 — Demo Call (Day 0)

**Goal:** Show a live Donna call scenario, qualify, and get verbal commitment.

**Demo script outline (15 minutes):**

1. **0–2 min** — Discovery: how many locations, PMS, current call volume, pain points
2. **2–8 min** — Live demo: play a Donna call (or screen-share a live test call)
   - Show booking confirmation appearing in PMS in real time
   - Show after-hours call handling
3. **8–12 min** — ROI math:
   - "You have X locations × $299/month = $Y/month"
   - "Your front desk FTE cost is probably $Z/year"
   - "Donna handles all the scheduling calls for $Y/month — what does that free your team to do?"
4. **12–14 min** — Address objections (see below)
5. **14–15 min** — Next step: "I'll send over a 1-pager and intake form. Implementation takes 3–5 days. Want to kick it off?"

**Common objections & responses:**

| Objection | Response |
|---|---|
| "We have staff who handle calls" | "Donna doesn't replace them — she handles overflow, after-hours, and busy periods. Your team focuses on patients in the building." |
| "We're under contract with another system" | "When does that expire? I can have Donna ready to go the day you're free." |
| "We need to involve IT / our office manager" | "Totally fine. Can I set up a 20-minute call with the three of us this week?" |
| "What if patients don't like talking to AI?" | "Donna sounds natural and never puts a patient on hold. Most patients don't realize they're talking to AI — and they prefer no hold time over knowing." |
| "We're not ready yet" | "What would need to change for you to be ready? I'll follow up in [timeframe]." |

---

## Stage 3 — Post-Demo Follow-Up (Day 1)

**Send within 24 hours of demo:**

```
Subject: Donna — next steps for {{company_name}}

Hi {{first_name}},

Great to connect today. Quick recap:

- {{company_name}} has [X] locations on [PMS]
- You're currently [pain point they mentioned]
- Donna can be live in 3–5 business days from when we kick off

Attached: Donna one-pager with pricing.

To get started, I just need you to fill out a short intake form (~10 minutes) and we'll schedule implementation.

→ Intake form: [link — to be added]
→ Questions? Just reply here.

If timing isn't right now, no pressure — happy to reconnect in [timeframe they mentioned].

— Utkarsh
Donna Associates
```

---

## Stage 4 — Follow-Up Sequence (if no response after demo)

| Day | Action |
|---|---|
| Day 3 | Send 1 follow-up: "Did you get a chance to look at the one-pager?" |
| Day 7 | Send ROI-focused follow-up: "Quick math on your situation…" |
| Day 14 | Final check-in: "Closing the loop — still interested?" |
| Day 30 | Move to nurture list. Schedule re-outreach in 60 days. |

**Day 3 follow-up:**
```
Hi {{first_name}},

Just checking in — did you get a chance to look at the one-pager from our call?

Happy to answer any questions or set up a follow-up with your team. Implementation really is 3–5 days once we have the intake info.

— Utkarsh
```

**Day 7 follow-up:**
```
Hi {{first_name}},

Quick math on your situation:

{{company_name}} has [X] locations. At $299/location/month, Donna costs $[X × 299]/month.

One missed patient appointment per day per location = $200–800 in lost revenue.

Most groups recover Donna's cost in the first week. Wanted to make sure you had that framing before deciding.

Still interested in moving forward?

— Utkarsh
```

---

## Stage 5 — Intake & Contract (Day 1–5 after commitment)

1. Send intake form (link to onboarding checklist)
2. Receive completed intake
3. Send service agreement for signature (DocuSign or equivalent)
4. Collect payment method
5. Begin provisioning (`scripts/deploy-client.ts`)

---

## Stage 6 — Go-Live (Day 3–5 after intake received)

1. Donna provisioned and tested internally
2. Test call with client
3. Client confirms Donna sounds right and books correctly
4. Switch live: forward main line to Donna's number (or configure call routing)
5. Send go-live confirmation email:

```
Subject: Donna is live for {{company_name}} 🎉

Hi {{first_name}},

Donna is now live on your main line.

Donna's number: [TWILIO_NUMBER]
Test it anytime — call that number and book a test appointment.

What to expect:
- Donna answers every call within 1 ring
- Appointments appear in [PMS] within 60 seconds
- After-hours calls are handled automatically per your rules

Any issues in the first 30 days, reply here and we'll fix it immediately.

Welcome to the Donna family.

— Utkarsh
Donna Associates
```

---

## KPIs to Track

| Metric | Target |
|---|---|
| Demos booked | 3+ before DON-11 email batch sends |
| Demo → intake form submitted | >50% conversion |
| Intake form → paid client | >70% conversion |
| Days to go-live | ≤5 business days |
| First 30-day retention | 100% (first 10 clients) |

---

*Donna Associates | utkarsh@donna.associates | donna.associates*
