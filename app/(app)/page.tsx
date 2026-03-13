"use client";

import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900">
      <Hero />
      <PainSection />
      <ValueProps />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <FAQ />
      <ContactForm />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-[#0d1b2a] text-white py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-teal-400 text-sm font-semibold uppercase tracking-widest mb-4">
          Voice AI for Dental Groups
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
          Every missed call is a{" "}
          <span className="text-teal-400">missed patient.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Donna answers every inbound call 24/7 — and books appointments directly into your
          practice management system. No hold times. No missed calls. No extra headcount.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg text-lg transition-colors"
          >
            Book a Free Demo →
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center px-8 py-4 border border-gray-500 hover:border-white text-gray-300 hover:text-white font-semibold rounded-lg text-lg transition-colors"
          >
            See How It Works
          </a>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Trusted by dental groups across the US. Setup in days, not months.
        </p>
      </div>
    </section>
  );
}

function PainSection() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-[#0d1b2a] mb-4">
          Your front desk can&apos;t be everywhere at once.
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Multi-location dental groups lose appointments every day to unanswered calls.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { icon: "🌙", title: "After-hours calls", body: "Go to voicemail — patients call the next clinic." },
            { icon: "🍽️", title: "Lunchtime rushes", body: "Overwhelm your team — patients hang up." },
            { icon: "👥", title: "Staff shortages", body: "Create hold times — patients don't wait." },
            { icon: "💸", title: "Every missed call", body: "Is $200–$800 in lost revenue, compounded across locations." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-[#0d1b2a]">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 mt-10 text-lg">
          Your front desk is working hard. But they&apos;re human. <strong>Donna isn&apos;t.</strong>
        </p>
      </div>
    </section>
  );
}

function ValueProps() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-teal-500 text-sm font-semibold uppercase tracking-widest text-center mb-4">
          The Solution
        </p>
        <h2 className="text-3xl font-bold text-center text-[#0d1b2a] mb-14">
          Meet Donna — your always-on AI receptionist.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: "📞",
              title: "Never Miss a Call",
              body: "Donna answers every inbound call instantly, day or night. No voicemails. No hold music. No missed patients.",
            },
            {
              icon: "📅",
              title: "Books Appointments Automatically",
              body: "Donna integrates directly with Dentrix, Eaglesoft, OpenDental, and more — booking, rescheduling, and confirming in real time.",
            },
            {
              icon: "🏢",
              title: "Scales Across All Locations",
              body: "One Donna deployment covers your entire group. Whether you have 3 locations or 30, every patient gets the same seamless experience.",
            },
          ].map((v) => (
            <div key={v.title} className="text-center">
              <div className="text-5xl mb-5">{v.icon}</div>
              <h3 className="text-xl font-bold text-[#0d1b2a] mb-3">{v.title}</h3>
              <p className="text-gray-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-[#0d1b2a] text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-14">Up and running in 3 steps.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { n: "1", title: "Connect", body: "We integrate Donna with your PMS and phone system. Most groups are live within 3 business days." },
            { n: "2", title: "Train", body: "We configure Donna with your scheduling rules, provider availability, insurance protocols, and FAQs. She sounds like your practice." },
            { n: "3", title: "Launch", body: "Donna starts answering calls. Your team focuses on patients in the chair — not patients on hold." },
          ].map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-teal-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-5">
                {step.n}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="py-20 px-4 bg-teal-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-[#0d1b2a] mb-12">
          What dental groups are saying
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              quote: "We went from missing 40+ calls a week to zero. Donna paid for herself in the first month.",
              author: "Office Manager, 7-location DSO, Texas",
            },
            {
              quote: "Our no-show rate dropped 18% after Donna started handling confirmation calls.",
              author: "COO, Regional Dental Group, Florida",
            },
          ].map((t) => (
            <div key={t.author} className="bg-white rounded-xl p-8 shadow-sm border border-teal-100">
              <p className="text-gray-700 italic leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-sm text-gray-400 font-medium">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-[#0d1b2a] mb-4">
          Simple, predictable pricing.
        </h2>
        <p className="text-gray-500 mb-12">No per-minute surprises. No long-term contracts.</p>
        <div className="bg-[#0d1b2a] text-white rounded-2xl p-10 text-left shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {[
              { label: "Implementation fee", value: "$1,500 (up to 5 locations)" },
              { label: "Additional locations", value: "$300 / location" },
              { label: "Monthly maintenance", value: "$299 / location / month" },
              { label: "Calls included", value: "Unlimited" },
              { label: "Contract", value: "Month-to-month" },
              { label: "Setup time", value: "3 business days" },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-gray-400 text-sm">{row.label}</p>
                <p className="text-white font-semibold text-lg">{row.value}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              The average front desk FTE costs $35,000–$50,000/year. Donna handles all scheduling
              calls for a 5-location group at{" "}
              <span className="text-teal-400 font-semibold">$1,795/month</span> — and she never
              calls in sick.
            </p>
          </div>
        </div>
        <a
          href="#contact"
          className="inline-flex items-center justify-center mt-8 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg text-lg transition-colors"
        >
          Get a custom quote for your group →
        </a>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Does Donna replace my front desk?",
      a: "No — Donna handles the phone. Your team handles everything that requires a human touch. Think of Donna as a dedicated phone specialist that frees your team to focus on in-office patients.",
    },
    {
      q: "Which practice management systems does Donna support?",
      a: "Dentrix, Eaglesoft, OpenDental, Carestream, Curve, and PlanetDDS. Additional integrations available on request.",
    },
    {
      q: "How long does setup take?",
      a: "Most groups are live within 3 business days. We handle the integration and configuration — your team just needs to be available for a 1-hour onboarding call.",
    },
    {
      q: "Is there a long-term contract?",
      a: "No. Month-to-month. Cancel anytime.",
    },
    {
      q: "What happens when Donna can't handle a call?",
      a: "Donna transfers the call to your front desk and sends you a notification with a call summary. No patient falls through the cracks.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-[#0d1b2a] mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.q} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-[#0d1b2a] mb-2">{item.q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", practice: "", locations: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <section id="contact" className="py-20 px-4 bg-[#0d1b2a] text-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Ready to stop missing calls?
        </h2>
        <p className="text-center text-gray-400 mb-10">
          Book a 15-minute demo. We&apos;ll show you exactly how Donna works for groups like yours
          — no pitch, no pressure.
        </p>

        {state === "success" ? (
          <div className="bg-teal-500/20 border border-teal-500/40 rounded-xl p-8 text-center">
            <p className="text-teal-300 text-xl font-semibold">Thank you!</p>
            <p className="text-gray-400 mt-2">We&apos;ll be in touch within one business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Your name *</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Work email *</label>
                <input
                  required
                  type="email"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="jane@dentalgroup.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Practice name *</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Sunshine Dental Group"
                  value={form.practice}
                  onChange={(e) => setForm({ ...form, practice: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Number of locations</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="5"
                  value={form.locations}
                  onChange={(e) => setForm({ ...form, locations: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Anything else?</label>
              <textarea
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="Tell us about your practice or any specific questions..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            {state === "error" && (
              <p className="text-red-400 text-sm">Something went wrong. Please try again or email us directly.</p>
            )}
            <button
              type="submit"
              disabled={state === "loading"}
              className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold rounded-lg text-lg transition-colors"
            >
              {state === "loading" ? "Sending..." : "Book a Demo →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#060e18] text-gray-500 py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <p className="text-white font-bold text-lg">Donna Associates</p>
          <p className="text-sm">Voice AI appointment booking for dental clinic groups.</p>
        </div>
        <p className="text-sm">© 2026 Donna Associates. All rights reserved.</p>
        <div className="flex gap-6 text-sm">
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          <Link href="/search" className="hover:text-white transition-colors">Patient Portal</Link>
        </div>
      </div>
    </footer>
  );
}
