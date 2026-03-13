import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";

/**
 * @openapi
 * /api/appointments:
 *   get:
 *     summary: List the authenticated patient's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, RESCHEDULED]
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of appointments
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as AppointmentStatus | null;
    const upcoming = searchParams.get("upcoming") === "true";

    // Fetch patient record
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        ...(statusParam && { status: statusParam }),
        ...(upcoming && { startTime: { gte: new Date() } }),
      },
      include: {
        dentist: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                phone: true,
              },
            },
          },
        },
        slot: true,
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ data: appointments, total: appointments.length });
  } catch (error) {
    console.error("[GET /api/appointments]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dentistId, slotId, type]
 *             properties:
 *               dentistId:
 *                 type: string
 *               slotId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [GENERAL_CHECKUP, CLEANING, FILLING, ROOT_CANAL, EXTRACTION, CROWN, WHITENING, ORTHODONTICS, EMERGENCY, CONSULTATION, OTHER]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked
 *       400:
 *         description: Slot not available
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dentistId, slotId, type, notes } = body;

    if (!dentistId || !slotId || !type) {
      return NextResponse.json(
        { error: "dentistId, slotId, and type are required" },
        { status: 422 }
      );
    }

    // Get patient record
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient profile not found. Please complete your profile." },
        { status: 404 }
      );
    }

    // Verify slot is available (use transaction to prevent race condition)
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
        include: { dentist: { include: { clinic: true } } },
      });

      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }
      if (slot.isBooked || slot.isBlocked) {
        throw new Error("SLOT_UNAVAILABLE");
      }
      if (slot.dentistId !== dentistId) {
        throw new Error("SLOT_DENTIST_MISMATCH");
      }

      // Mark slot as booked
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      // Create appointment
      const newAppointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          dentistId,
          clinicId: slot.dentist.clinicId || undefined,
          slotId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type,
          status: "CONFIRMED",
          notes,
          confirmedAt: new Date(),
        },
        include: {
          dentist: { include: { clinic: true } },
          patient: true,
          slot: true,
        },
      });

      return newAppointment;
    });

    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/appointments]", error);

    if (error instanceof Error) {
      if (error.message === "SLOT_NOT_FOUND") {
        return NextResponse.json(
          { error: "Time slot not found" },
          { status: 404 }
        );
      }
      if (error.message === "SLOT_UNAVAILABLE") {
        return NextResponse.json(
          { error: "This time slot is no longer available" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
