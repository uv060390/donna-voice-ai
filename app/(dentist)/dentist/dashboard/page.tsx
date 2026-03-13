import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DentistDashboard() {
  const session = await auth();
  const dentist = session
    ? await prisma.dentist.findFirst({
        where: { userId: session.user.id },
        include: { clinic: true },
      })
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = dentist
    ? await prisma.appointment.findMany({
        where: {
          dentistId: dentist.id,
          startTime: { gte: today, lt: tomorrow },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        include: { patient: true, slot: true },
        orderBy: { startTime: "asc" },
      })
    : [];

  const pendingCount = dentist
    ? await prisma.appointment.count({
        where: { dentistId: dentist.id, status: "PENDING" },
      })
    : 0;

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthCount = dentist
    ? await prisma.appointment.count({
        where: {
          dentistId: dentist.id,
          startTime: { gte: thisMonthStart },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      })
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0d1b2a] mb-1">
        Good {getTimeOfDay()}, Dr. {session?.user.name?.split(" ").pop() ?? ""}
      </h1>
      <p className="text-gray-500 mb-8">
        {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <StatCard label="Today's appointments" value={todayAppointments.length} />
        <StatCard label="Pending requests" value={pendingCount} urgent={pendingCount > 0} />
        <StatCard label="Confirmed this month" value={monthCount} />
      </div>

      {/* Today's schedule */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0d1b2a]">Today&apos;s Schedule</h2>
          <Link href="/dentist/appointments" className="text-sm text-teal-600 hover:underline">
            View all
          </Link>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            No appointments scheduled for today.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayAppointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/dentist/appointments/${appt.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-500 w-16">
                  {new Date(appt.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#0d1b2a]">{appt.patient.firstName} {appt.patient.lastName}</p>
                  <p className="text-xs text-gray-400">{appt.type.replace("_", " ")}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    appt.status === "CONFIRMED"
                      ? "bg-teal-50 text-teal-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {appt.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  urgent,
}: {
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-6 ${urgent ? "border-yellow-200" : "border-gray-100"}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-4xl font-bold mt-1 ${urgent ? "text-yellow-600" : "text-[#0d1b2a]"}`}>
        {value}
      </p>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
