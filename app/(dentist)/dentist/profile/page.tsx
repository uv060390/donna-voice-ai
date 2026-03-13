"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";

interface DentistProfile {
  id: string;
  name: string;
  bio?: string | null;
  specialties: string[];
  yearsExperience?: number | null;
  education?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  clinic?: { name: string; city: string; state: string } | null;
}

export default function DentistProfilePage() {
  const [profile, setProfile] = useState<DentistProfile | null>(null);
  const [form, setForm] = useState<Partial<DentistProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/dentists/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setProfile(data);
          setForm({
            bio: data.bio ?? "",
            specialties: data.specialties ?? [],
            yearsExperience: data.yearsExperience ?? "",
            education: data.education ?? "",
            phone: data.phone ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const res = await fetch(`/api/dentists/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="text-gray-400 py-20 text-center">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="text-gray-400 py-20 text-center">
        Profile not found. Please contact support.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0d1b2a] mb-1">My Profile</h1>
      <p className="text-gray-500 mb-8">
        {profile.clinic
          ? `${profile.clinic.name} · ${profile.clinic.city}, ${profile.clinic.state}`
          : "No clinic linked"}
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0d1b2a]">Practice Information</h2>

          <Input
            label="Phone number"
            type="tel"
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+15125550100"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              value={form.bio ?? ""}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell patients a bit about yourself..."
            />
          </div>

          <Input
            label="Education"
            value={form.education ?? ""}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
            placeholder="DMD, University of Texas School of Dentistry"
          />

          <Input
            label="Years of experience"
            type="number"
            min="0"
            value={form.yearsExperience ?? ""}
            onChange={(e) =>
              setForm({ ...form, yearsExperience: parseInt(e.target.value) || undefined })
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialties (comma-separated)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={(form.specialties ?? []).join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  specialties: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="General Dentistry, Cosmetic, Orthodontics"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && <span className="text-sm text-teal-600">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
