"use client";

import { useState, useEffect } from "react";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isBlocked: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm

function fmtHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${ampm}`;
}

function toIsoDatetime(date: Date, hour: number): string {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export default function AvailabilityPage() {
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getWeekStart(weekOffset);

  useEffect(() => {
    fetch("/api/dentists/me")
      .then((r) => r.json())
      .then((d) => d.id && setDentistId(d.id));
  }, []);

  useEffect(() => {
    if (!dentistId) return;
    setLoading(true);
    const from = weekStart.toISOString();
    const to = new Date(weekStart.getTime() + 7 * 86400000).toISOString();
    fetch(`/api/availability?dentistId=${dentistId}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setSlots(Array.isArray(data) ? data : data.data ?? []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistId, weekOffset]);

  async function toggleSlot(dayDate: Date, hour: number) {
    if (!dentistId) return;
    setSaving(true);
    const existing = slots.find((s) => {
      const slotHour = new Date(s.startTime).getHours();
      const slotDate = new Date(s.startTime).toDateString();
      return slotHour === hour && slotDate === dayDate.toDateString();
    });

    if (existing) {
      const res = await fetch(`/api/availability?id=${existing.id}`, { method: "DELETE" });
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== existing.id));
      }
    } else {
      const startISO = toIsoDatetime(dayDate, hour);
      const endISO = toIsoDatetime(dayDate, hour + 1);
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dentistId, slots: [{ startTime: startISO, endTime: endISO }] }),
      });
      if (res.ok) {
        const from = weekStart.toISOString();
        const to = new Date(weekStart.getTime() + 7 * 86400000).toISOString();
        const refreshed = await fetch(
          `/api/availability?dentistId=${dentistId}&from=${from}&to=${to}`
        ).then((r) => r.json());
        setSlots(Array.isArray(refreshed) ? refreshed : refreshed.data ?? []);
      }
    }
    setSaving(false);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b2a]">Availability</h1>
          <p className="text-gray-500 text-sm mt-1">Click a slot to add or remove it.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="text-sm font-medium">
            {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-20 px-3 py-3 text-left text-gray-400 font-normal">Time</th>
                {weekDays.map((d) => (
                  <th key={d.toISOString()} className="px-2 py-3 text-center font-medium text-[#0d1b2a]">
                    <div>{DAYS[d.getDay()].slice(0, 3)}</div>
                    <div className="text-xs text-gray-400 font-normal">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-400 text-xs">{fmtHour(hour)}</td>
                  {weekDays.map((d) => {
                    const slot = slots.find((s) => {
                      const slotHour = new Date(s.startTime).getHours();
                      const slotDate = new Date(s.startTime).toDateString();
                      return slotHour === hour && slotDate === d.toDateString();
                    });
                    const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <td key={d.toISOString()} className="px-2 py-1 text-center">
                        <button
                          disabled={isPast || saving}
                          onClick={() => toggleSlot(d, hour)}
                          className={`w-full rounded py-1.5 text-xs transition-colors ${
                            isPast
                              ? "bg-gray-50 text-gray-200 cursor-default"
                              : slot?.isBooked
                              ? "bg-blue-100 text-blue-600 cursor-default"
                              : slot
                              ? "bg-teal-500 text-white hover:bg-teal-600"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {slot?.isBooked ? "★" : slot ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getWeekStart(offset: number): Date {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
