export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function DentistLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/dentist/dashboard");
  }

  // Only dentist and admin roles can access this section
  if (!["DENTIST", "CLINIC_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const navLinks = [
    { href: "/dentist/dashboard", label: "Dashboard" },
    { href: "/dentist/profile", label: "My Profile" },
    { href: "/dentist/availability", label: "Availability" },
    { href: "/dentist/appointments", label: "Appointments" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0d1b2a] text-white flex flex-col min-h-screen fixed top-0 left-0">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-teal-400 text-xl">🦷</span>
            <span className="font-bold text-sm">DentCall</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Dentist Portal</p>
        </div>
        <nav className="flex-1 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center px-5 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-500 truncate mb-3">{session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 p-8">{children}</main>
    </div>
  );
}
