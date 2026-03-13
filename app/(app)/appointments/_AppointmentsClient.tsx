"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" | "RESCHEDULED";

interface Appointment {
  id: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  slot?: {
    startTime: string;
    endTime: string;
  };
  dentist?: {
    id: string;
    name: string;
    clinic?: {
      name: string;
      city: string;
      state: string;
    };
  };
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No Show",
  RESCHEDULED: "Rescheduled",
};

const STATUS_VARIANTS: Record<AppointmentStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "danger",
  COMPLETED: "info",
  NO_SHOW: "danger",
  RESCHEDULED: "warning",
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL_CHECKUP: "General Checkup",
  CLEANING: "Cleaning",
  FILLING: "Filling",
  ROOT_CANAL: "Root Canal",
  EXTRACTION: "Extraction",
  CROWN: "Crown",
  TEETH_WHITENING: "Teeth Whitening",
  CONSULTATION: "Consultation",
  EMERGENCY: "Emergency",
  ORTHODONTIC_CONSULTATION: "Orthodontic Consultation",
  OTHER: "Other",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ [tab === "upcoming" ? "upcoming" : "status"]: tab === "upcoming" ? "true" : "COMPLETED,CANCELLED" });
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : data.appointments || []))
      .finally(() => setLoading(false));
  }, [tab]);

  async function handleCancel(appointmentId: string) {
    if (!confirm("Cancel this appointment?")) return;
    setCancelling(appointmentId);
    await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "CANCELLED" } : a))
    );
    setCancelling(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0d1b2a]">My Appointments</h1>
        <Link href="/search">
          <Button className="bg-teal-500 hover:bg-teal-600 text-white border-0" size="sm">
            + Book New
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "upcoming"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "past"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("past")}
        >
          Past
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-4xl">📅</span>
          <p className="mt-4 text-gray-500">
            {tab === "upcoming"
              ? "No upcoming appointments."
              : "No past appointments."}
          </p>
          {tab === "upcoming" && (
            <Link href="/search" className="mt-4 inline-block">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white border-0">
                Find a Dentist
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onCancel={handleCancel}
              cancelling={cancelling === appt.id}
              isUpcoming={tab === "upcoming"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  cancelling,
  isUpcoming,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  cancelling: boolean;
  isUpcoming: boolean;
}) {
  const startTime = appointment.slot
    ? new Date(appointment.slot.startTime)
    : null;

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[#0d1b2a]">
                {TYPE_LABELS[appointment.type] || appointment.type}
              </span>
              <Badge variant={STATUS_VARIANTS[appointment.status]}>
                {STATUS_LABELS[appointment.status]}
              </Badge>
            </div>

            {appointment.dentist && (
              <p className="text-sm text-gray-600 mt-1">
                Dr. {appointment.dentist.name}
                {appointment.dentist.clinic && (
                  <span className="text-gray-400">
                    {" "}— {appointment.dentist.clinic.name}, {appointment.dentist.clinic.city}
                  </span>
                )}
              </p>
            )}

            {startTime && (
              <p className="text-sm text-gray-500 mt-1">
                📅{" "}
                {startTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at{" "}
                {startTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}

            {appointment.notes && (
              <p className="text-xs text-gray-400 mt-2 italic">{appointment.notes}</p>
            )}
          </div>

          {isUpcoming && appointment.status !== "CANCELLED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(appointment.id)}
              loading={cancelling}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 shrink-0"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
