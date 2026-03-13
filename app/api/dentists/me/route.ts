import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dentist = await prisma.dentist.findFirst({
    where: { userId: session.user.id },
    include: { clinic: true },
  });

  if (!dentist) {
    return NextResponse.json({ error: "Dentist profile not found" }, { status: 404 });
  }

  return NextResponse.json(dentist);
}
