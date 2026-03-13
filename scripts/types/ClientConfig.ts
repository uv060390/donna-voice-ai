import { z } from "zod";

// PMS (Practice Management Software) types supported
export const PmsTypeEnum = z.enum([
  "dentrix",
  "eaglesoft",
  "opendental",
  "carestream",
  "curve",
  "planetdds",
  "other",
]);
export type PmsType = z.infer<typeof PmsTypeEnum>;

// Per-day hours schema
export const DayHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").nullable(),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").nullable(),
});
export type DayHours = z.infer<typeof DayHoursSchema>;

// Weekly hours schema
export const WeeklyHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema.optional(),
  sunday: DayHoursSchema.optional(),
});
export type WeeklyHours = z.infer<typeof WeeklyHoursSchema>;

// Provisioned state (written by deploy script, not required in input)
export const ProvisionedSchema = z.object({
  twilioPhoneNumber: z.string().optional(),
  twilioPhoneSid: z.string().optional(),
  vapiAssistantId: z.string().optional(),
  vapiPhoneNumberId: z.string().optional(),
  railwayProjectId: z.string().optional(),
  railwayServiceId: z.string().optional(),
  deployedUrl: z.string().url().optional(),
  provisionedAt: z.string().datetime().optional(),
});
export type Provisioned = z.infer<typeof ProvisionedSchema>;

// Main client config schema
export const ClientConfigSchema = z.object({
  clientId: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/, "Must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2, "Must be 2-letter state code"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Must be valid US ZIP"),
  timezone: z.string().min(1),
  areaCode: z.string().regex(/^\d{3}$/, "Must be 3-digit area code"),
  pmsType: PmsTypeEnum,
  practicePhone: z
    .string()
    .regex(/^\+1\d{10}$/, "Must be E.164 format: +1XXXXXXXXXX"),
  practiceEmail: z.string().email(),
  hours: WeeklyHoursSchema,
  provisioned: ProvisionedSchema.optional(),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

export function parseClientConfig(raw: unknown): ClientConfig {
  return ClientConfigSchema.parse(raw);
}

export function parseClientConfigSafe(raw: unknown) {
  return ClientConfigSchema.safeParse(raw);
}
