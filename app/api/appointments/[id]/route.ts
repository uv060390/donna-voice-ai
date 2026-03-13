import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

/**
 * @openapi
 * /api/appointments/{id}:
 *   get:
 *     summary: Get a single appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment detail
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        dentist: { include: { clinic: true } },
        patient: true,
        slot: true,
        callLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify access: patient, dentist, or admin
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });
    const dentist = await prisma.dentist.findUnique({
      where: { userId: session.user.id },
    });

    const isPatient = patient?.id === appointment.patientId;
    const isDentist = dentist?.id === appointment.dentistId;
    const isAdmin = ["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role);

    if (!isPatient && !isDentist && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error("[GET /api/appointments/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/appointments/{id}:
 *   patch:
 *     summary: Update appointment status (confirm/cancel/reschedule)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW]
 *               cancelReason:
 *                 type: string
 *               notes:
 *                 type: string
 *               newSlotId:
 *                 type: string
 *                 description: For rescheduling — provide a new slot ID
 *     responses:
 *       200:
 *         description: Updated appointment
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Unauthorized
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Access check
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });
    const dentist = await prisma.dentist.findUnique({
      where: { userId: session.user.id },
    });
    const isPatient = patient?.id === appointment.patientId;
    const isDentist = dentist?.id === appointment.dentistId;
    const isAdmin = ["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role);

    if (!isPatient && !isDentist && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status, cancelReason, notes, newSlotId } = body;

    // Handle reschedule
    if (newSlotId && newSlotId !== appointment.slotId) {
      const updated = await prisma.$transaction(async (tx) => {
        // Free up old slot
        if (appointment.slotId) {
          await tx.availabilitySlot.update({
            where: { id: appointment.slotId },
            data: { isBooked: false },
          });
        }

        // Check and book new slot
        const newSlot = await tx.availabilitySlot.findUnique({
          where: { id: newSlotId },
        });

        if (!newSlot || newSlot.isBooked || newSlot.isBlocked) {
          throw new Error("NEW_SLOT_UNAVAILABLE");
        }

        await tx.availabilitySlot.update({
          where: { id: newSlotId },
          data: { isBooked: true },
        });

        return tx.appointment.update({
          where: { id: params.id },
          data: {
            slotId: newSlotId,
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
          include: { dentist: { include: { clinic: true } }, patient: true },
        });
      });

      return NextResponse.json({ data: updated });
    }

    // Handle status changes
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = cancelReason || null;
        // Free up the slot
        if (appointment.slotId) {
          await prisma.availabilitySlot.update({
            where: { id: appointment.slotId },
            data: { isBooked: false },
          });
        }
      }
      if (status === "CONFIRMED") {
        updateData.confirmedAt = new Date();
      }
      if (status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: { dentist: { include: { clinic: true } }, patient: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/appointments/[id]]", error);

    if (error instanceof Error && error.message === "NEW_SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "The selected time slot is no longer available" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete an appointment (admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Free slot
    if (appointment.slotId) {
      await prisma.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }

    await prisma.appointment.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("[DELETE /api/appointments/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
