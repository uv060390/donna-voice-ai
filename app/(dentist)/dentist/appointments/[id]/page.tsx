"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AppointmentDetail {
  id: string;
  startTime: string;
  type: string;
  status: string;
  notes?: string | null;
  patient: { firstName: string; lastName: string; email: string; phone?: string | null; dateOfBirth?: string | null };
  slot?: { startTime: string; endTime: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-gray-100 text-gray-500 border-gray-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAppt = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/appointments/${id}`)
      .then((r) => r.json())
      .then(setAppt)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchAppt();
  }, [fetchAppt]);

  async function updateStatus(status: string) {
    if (!appt) return;
    setSaving(true);
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAppt((prev) => prev ? { ...prev, status } : prev);
    }
    setSaving(false);
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>;
  if (!appt) return (
    <div className="py-20 text-center text-gray-400">
      Appointment not found.{" "}
      <Link href="/dentist/appointments" className="text-teal-600 underline">Go back</Link>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700">
          ← Back
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Appointment Detail</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0d1b2a]">`${appt.patient.firstName} ${appt.patient.lastName}`</h1>
            <p className="text-gray-400 text-sm mt-1">
              {new Date(appt.startTime).toLocaleString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
                hour: "numeric", minute: "2-digit",
              })}
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium border ${STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
            {appt.status}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Detail label="Type" value={appt.type.replace("_", " ")} />
          <Detail label="Email" value={appt.patient.email} />
          <Detail label="Phone" value={appt.patient.phone ?? "—"} />
          <Detail label="Date of birth" value={appt.patient.dateOfBirth ? new Date(appt.patient.dateOfBirth).toLocaleDateString() : "—"} />
          {appt.slot && (
            <Detail label="Time slot" value={`${appt.slot.startTime} – ${appt.slot.endTime}`} />
          )}
        </div>

        {appt.notes && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Notes</p>
            <p className="text-sm text-gray-600">{appt.notes}</p>
          </div>
        )}

        {/* Actions */}
        {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
          <div className="flex gap-3 pt-2">
            {appt.status === "PENDING" && (
              <button
                onClick={() => updateStatus("CONFIRMED")}
                disabled={saving}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirm Appointment
              </button>
            )}
            {appt.status === "CONFIRMED" && (
              <button
                onClick={() => updateStatus("COMPLETED")}
                disabled={saving}
                className="px-5 py-2.5 bg-[#0d1b2a] hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Mark Completed
              </button>
            )}
            <button
              onClick={() => updateStatus("CANCELLED")}
              disabled={saving}
              className="px-5 py-2.5 border border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-gray-700 font-medium">{value}</p>
    </div>
  );
}
