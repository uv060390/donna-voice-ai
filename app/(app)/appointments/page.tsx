import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppointmentsClient from "./_AppointmentsClient";

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin?callbackUrl=/appointments");
  }
  return <AppointmentsClient />;
}
