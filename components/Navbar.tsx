import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-50 bg-[#0d1b2a] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-teal-400 text-2xl">🦷</span>
            <span className="font-bold text-xl tracking-tight">DentCall</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-gray-300 hover:text-white text-sm transition-colors">
              Find a Dentist
            </Link>
            {session && (
              <Link href="/appointments" className="text-gray-300 hover:text-white text-sm transition-colors">
                My Appointments
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">{session.user?.name || session.user?.email}</span>
                <form action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}>
                  <button type="submit" className="px-3 py-1.5 text-sm border border-gray-600 rounded-lg text-gray-300 hover:border-white hover:text-white transition-colors">
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <>
                <Link href="/auth/signin" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
