import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0d1b2a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Book your dentist{" "}
            <span className="text-teal-400">in seconds</span>
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Search thousands of dentists, check real-time availability, and book appointments online
            — or call our 24/7 AI voice line.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/search">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white border-0 text-lg px-8 py-3 h-auto">
                Find a Dentist
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="border-gray-500 text-gray-200 hover:border-white hover:text-white text-lg px-8 py-3 h-auto">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#0d1b2a] mb-12">
            Everything you need to manage your dental care
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔍"
              title="Smart Search"
              description="Filter by specialty, location, and availability. Find the right dentist near you instantly."
            />
            <FeatureCard
              icon="📅"
              title="Real-Time Booking"
              description="See live availability and book your appointment online in under a minute."
            />
            <FeatureCard
              icon="📞"
              title="24/7 Phone Booking"
              description="Our AI voice agent takes calls around the clock — book by phone anytime, day or night."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 px-4 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#0d1b2a] mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Step number="1" title="Search" description="Find dentists by name, city, or specialty." />
            <Step number="2" title="Pick a slot" description="Browse available time slots and pick what works for you." />
            <Step number="3" title="Confirm" description="Book instantly and receive email confirmation." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-teal-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#0d1b2a]">Ready to get started?</h2>
          <p className="text-gray-500 mt-2 mb-6">
            Join thousands of patients managing their dental health with DentCall.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white border-0 text-lg px-8 py-3 h-auto">
              Sign Up Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1b2a] text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-teal-400 text-xl">🦷</span>
            <span className="text-white font-semibold">DentCall</span>
          </div>
          <p className="text-sm">© 2026 DentCall. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/search" className="hover:text-white transition-colors">Find Dentists</Link>
            <Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold text-[#0d1b2a] text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">
        {number}
      </div>
      <h3 className="font-semibold text-[#0d1b2a] mb-1">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}
