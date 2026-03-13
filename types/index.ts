import {
  Clinic,
  Dentist,
  Patient,
  Appointment,
  AvailabilitySlot,
  CallLog,
  AppointmentStatus,
  AppointmentType,
  CallStatus,
  CallDirection,
  UserRole,
} from "@prisma/client";

// Re-export Prisma enums
export {
  AppointmentStatus,
  AppointmentType,
  CallStatus,
  CallDirection,
  UserRole,
};

// Extended types with relations
export type DentistWithClinic = Dentist & {
  clinic: Clinic | null;
};

export type DentistWithRelations = Dentist & {
  clinic: Clinic | null;
  appointments: Appointment[];
  availabilitySlots: AvailabilitySlot[];
};

export type AppointmentWithRelations = Appointment & {
  dentist: Dentist & { clinic: Clinic | null };
  patient: Patient;
  slot: AvailabilitySlot | null;
};

export type PatientWithAppointments = Patient & {
  appointments: AppointmentWithRelations[];
};

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Search / filter params
export interface DentistSearchParams {
  q?: string;
  city?: string;
  state?: string;
  specialty?: string;
  accepting?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AvailabilitySearchParams {
  dentistId: string;
  from: string; // ISO date string
  to: string; // ISO date string
}

// Booking
export interface BookAppointmentPayload {
  dentistId: string;
  slotId: string;
  type: AppointmentType;
  notes?: string;
}

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
