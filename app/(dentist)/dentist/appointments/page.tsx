"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Appointment {
  id: string;
  startTime: string;
  type: string;
  status: string;
  notes?: string | null;
  patient: { firstName: string; lastName: string; email: string; phone?: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-teal-50 text-teal-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-50 text-red-600",
};

export default function DentistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    setLoading(true);
    const params = tab === "upcoming" ? "upcoming=true" : "status=COMPLETED,CANCELLED";
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : data.appointments ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0d1b2a] mb-6">Appointments</h1>

      <div className="flex gap-2 mb-6">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-[#0d1b2a] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No {tab} appointments.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-[#0d1b2a]">`${appt.patient.firstName} ${appt.patient.lastName}`</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(appt.startTime).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                      hour: "numeric", minute: "2-digit",
                    })}
                    {" · "}
                    {appt.type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-400">{appt.patient.email} · {appt.patient.phone ?? "—"}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {appt.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(appt.id, "CONFIRMED")}
                        className="px-3 py-1.5 text-xs bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateStatus(appt.id, "CANCELLED")}
                        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <Link
                    href={`/dentist/appointments/${appt.id}`}
                    className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
