# Donna — Client Onboarding Checklist

This is everything we need from a new client to provision and deploy their Donna instance. Collect this via intake form or discovery call.

Estimated time to go live after receiving all info: **3–5 business days**.

---

## 1. Practice Information

| Field | Notes | Required |
|---|---|---|
| Practice / Group name | Legal or trade name | ✅ |
| Street address | Primary or HQ address | ✅ |
| City | | ✅ |
| State | 2-letter code (e.g. TX) | ✅ |
| ZIP code | 5-digit or ZIP+4 | ✅ |
| Time zone | e.g. America/Chicago | ✅ |
| Practice phone number | E.164 format: +1XXXXXXXXXX | ✅ |
| Practice email | For system notifications | ✅ |
| Area code | 3-digit local area code for Donna's number | ✅ |
| Number of locations | | ✅ |

---

## 2. Practice Management Software (PMS)

| Field | Options | Required |
|---|---|---|
| PMS type | dentrix, eaglesoft, opendental, carestream, curve, planetdds, other | ✅ |
| PMS version | e.g. Dentrix G7 | Optional |
| PMS access credentials | Read/write API access or login | ✅ (at deploy) |
| PMS hosting | Cloud vs. on-premise | ✅ |

---

## 3. Operating Hours

Provide open and close times (HH:MM 24-hour format) for each day.

| Day | Open | Close | Notes |
|---|---|---|---|
| Monday | e.g. 08:00 | e.g. 17:00 | |
| Tuesday | | | |
| Wednesday | | | |
| Thursday | | | |
| Friday | | | |
| Saturday | | | Leave blank if closed |
| Sunday | | | Leave blank if closed |

---

## 4. Scheduling Rules

- [ ] Which providers are accepting new patients?
- [ ] What appointment types does Donna book? (cleaning, new patient exam, emergency, etc.)
- [ ] Any appointment types that must be booked by staff only?
- [ ] Minimum/maximum notice for booking (e.g. "no same-day bookings")
- [ ] Double-booking policy per provider
- [ ] Emergency / urgent call routing — who does Donna transfer to?

---

## 5. Insurance & FAQs

- [ ] List of accepted insurance plans (or "we accept all PPOs")
- [ ] Key FAQs Donna should answer (parking, services, languages spoken, etc.)
- [ ] After-hours emergency protocol (on-call number or voicemail)

---

## 6. Call Handling Preferences

- [ ] How should Donna introduce herself? (e.g. "Hi, this is Donna calling on behalf of [Practice Name]")
- [ ] Should Donna identify as AI if asked?
- [ ] Languages needed (default: English only)
- [ ] Call recording consent disclosure required? (state-specific)

---

## 7. Billing & Contract

- [ ] Billing contact name and email
- [ ] Credit card or ACH on file
- [ ] Signed service agreement

---

## Provisioning Checklist (Internal — Donna Team)

Once all info is collected, use `scripts/deploy-client.ts`:

```bash
npx ts-node scripts/deploy-client.ts configs/<client-id>.json
```

This script will:
- [ ] Provision a Twilio phone number (local to client's area code)
- [ ] Create and configure VAPI assistant with client scripts
- [ ] Deploy client backend on Railway
- [ ] Write provisioned IDs back to the config JSON

Estimated runtime: 5–10 minutes per client.

---

## Go-Live Verification

- [ ] Test call to Donna's number — books a test appointment
- [ ] Confirm PMS entry created correctly
- [ ] After-hours test call — Donna answers and routes correctly
- [ ] Client receives welcome email with Donna's phone number
- [ ] Client team briefed: "Donna is now live on your main line"

---

*Template version: March 2026 | Questions: utkarsh@donna.associates*
