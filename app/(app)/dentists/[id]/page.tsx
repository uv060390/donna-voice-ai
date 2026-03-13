"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface DentistDetail {
  id: string;
  name: string;
  specialties: string[];
  licenseNumber?: string;
  yearsExperience?: number;
  rating?: number;
  bio?: string;
  acceptingNewPatients: boolean;
  clinic?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    email?: string;
    timezone?: string;
  };
  availableSlots?: Slot[];
}

export default function DentistProfilePage() {
  const id = useParams<{ id: string }>()?.id ?? "";
  const router = useRouter();
  const [dentist, setDentist] = useState<DentistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dentists/${id}?includeslots=true&days=14`)
      .then((r) => r.json())
      .then((data) => {
        setDentist(data.dentist || data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleBookSlot(slotId: string) {
    setSelectedSlot(slotId);
    router.push(`/book/${id}?slotId=${slotId}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dentist) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Dentist not found.</p>
        <Link href="/search">
          <Button variant="outline" className="mt-4">Back to Search</Button>
        </Link>
      </div>
    );
  }

  const availableSlots = (dentist.availableSlots || []).filter((s) => !s.isBooked);

  // Group slots by date
  const slotsByDate: Record<string, Slot[]> = {};
  for (const slot of availableSlots) {
    const date = new Date(slot.startTime).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!slotsByDate[date]) slotsByDate[date] = [];
    slotsByDate[date].push(slot);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/search" className="text-sm text-teal-600 hover:underline mb-6 inline-block">
        ← Back to Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-2xl font-bold shrink-0">
                  {dentist.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-[#0d1b2a]">Dr. {dentist.name}</h1>
                  {dentist.clinic && (
                    <p className="text-gray-500 mt-0.5">{dentist.clinic.name}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {dentist.specialties.map((s) => (
                      <Badge key={s} variant="info">{s}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    {dentist.rating && (
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        {dentist.rating.toFixed(1)} rating
                      </span>
                    )}
                    {dentist.yearsExperience && (
                      <span>{dentist.yearsExperience} years experience</span>
                    )}
                    {dentist.acceptingNewPatients ? (
                      <Badge variant="success">Accepting new patients</Badge>
                    ) : (
                      <Badge variant="warning">Not accepting new patients</Badge>
                    )}
                  </div>
                </div>
              </div>

              {dentist.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{dentist.bio}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Availability slots */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[#0d1b2a]">Available Appointments</h2>
            </CardHeader>
            <CardBody>
              {Object.keys(slotsByDate).length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No available slots in the next 14 days.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(slotsByDate).slice(0, 7).map(([date, slots]) => (
                    <div key={date}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{date}</p>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => handleBookSlot(slot.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                              selectedSlot === slot.id
                                ? "bg-teal-500 text-white border-teal-500"
                                : "border-gray-200 hover:border-teal-400 hover:bg-teal-50 text-gray-700"
                            }`}
                          >
                            {new Date(slot.startTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar: clinic info */}
        <div className="space-y-4">
          {dentist.clinic && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-[#0d1b2a]">Location</h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm font-medium text-gray-800">{dentist.clinic.name}</p>
                <p className="text-sm text-gray-500 mt-1">{dentist.clinic.address}</p>
                <p className="text-sm text-gray-500">
                  {dentist.clinic.city}, {dentist.clinic.state} {dentist.clinic.zip}
                </p>
                {dentist.clinic.phone && (
                  <p className="text-sm text-gray-500 mt-2">📞 {dentist.clinic.phone}</p>
                )}
                {dentist.clinic.email && (
                  <p className="text-sm text-gray-500">✉️ {dentist.clinic.email}</p>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <p className="text-sm text-gray-600 mb-3">Prefer to book by phone?</p>
              <div className="flex items-center gap-2 text-teal-600 font-medium">
                <span>📞</span>
                <span className="text-lg">24/7 Booking Line</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Our AI voice agent will help you book instantly.</p>
              <Link href="/auth/signin" className="mt-3 block">
                <Button variant="outline" className="w-full text-sm">
                  Book Online Instead
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
