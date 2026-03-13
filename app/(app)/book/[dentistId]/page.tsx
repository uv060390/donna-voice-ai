"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const APPOINTMENT_TYPES = [
  { value: "GENERAL_CHECKUP", label: "General Checkup" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "FILLING", label: "Filling" },
  { value: "ROOT_CANAL", label: "Root Canal" },
  { value: "EXTRACTION", label: "Extraction" },
  { value: "CROWN", label: "Crown" },
  { value: "TEETH_WHITENING", label: "Teeth Whitening" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "ORTHODONTIC_CONSULTATION", label: "Orthodontic Consultation" },
  { value: "OTHER", label: "Other" },
];

interface DentistInfo {
  id: string;
  name: string;
  clinic?: { name: string; city: string; state: string };
}

interface SlotInfo {
  id: string;
  startTime: string;
  endTime: string;
}

export default function BookingPage() {
  const params = useParams<{ dentistId: string }>();
  const dentistId = params?.dentistId ?? "";
  const searchParams = useSearchParams();
  const slotId = searchParams?.get("slotId");
  const router = useRouter();

  const [dentist, setDentist] = useState<DentistInfo | null>(null);
  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [appointmentType, setAppointmentType] = useState("GENERAL_CHECKUP");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load dentist info
    fetch(`/api/dentists/${dentistId}`)
      .then((r) => r.json())
      .then((data) => setDentist(data.dentist || data));

    // Load slot info
    if (slotId) {
      fetch(`/api/availability?dentistId=${dentistId}&slotId=${slotId}`)
        .then((r) => r.json())
        .then((data) => {
          const slots = data.slots || data;
          if (Array.isArray(slots)) {
            const found = slots.find((s: SlotInfo) => s.id === slotId);
            if (found) setSlot(found);
          }
        });
    }
  }, [dentistId, slotId, router]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!slotId) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dentistId,
          slotId,
          type: appointmentType,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Booking failed. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-[#0d1b2a]">Appointment Booked!</h1>
        <p className="text-gray-500 mt-2">
          You&apos;ll receive a confirmation email shortly.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/appointments">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white border-0">
              View My Appointments
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline">Find Another Dentist</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link href={`/dentists/${dentistId}`} className="text-sm text-teal-600 hover:underline mb-6 inline-block">
        ← Back to Profile
      </Link>

      <h1 className="text-2xl font-bold text-[#0d1b2a] mb-6">Book Appointment</h1>

      <Card className="mb-4">
        <CardBody>
          {dentist && (
            <div>
              <p className="font-medium text-gray-800">Dr. {dentist.name}</p>
              {dentist.clinic && (
                <p className="text-sm text-gray-500">{dentist.clinic.name} — {dentist.clinic.city}, {dentist.clinic.state}</p>
              )}
            </div>
          )}
          {slot && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                📅{" "}
                <span className="font-medium">
                  {new Date(slot.startTime).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {" at "}
                <span className="font-medium">
                  {new Date(slot.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[#0d1b2a]">Appointment Details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleBook} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Select
              id="type"
              label="Appointment Type"
              options={APPOINTMENT_TYPES}
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Any special requests, symptoms, or information for the dentist..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white border-0"
              loading={loading}
              disabled={!slotId}
            >
              Confirm Booking
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
