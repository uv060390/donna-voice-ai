import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @openapi
 * /api/availability:
 *   get:
 *     summary: Get available slots for a dentist within a date range
 *     tags: [Availability]
 *     parameters:
 *       - in: query
 *         name: dentistId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of date range (ISO 8601)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of date range (ISO 8601)
 *     responses:
 *       200:
 *         description: Available slots grouped by date
 *       400:
 *         description: Missing required parameters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dentistId = searchParams.get("dentistId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!dentistId || !from || !to) {
      return NextResponse.json(
        { error: "dentistId, from, and to are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use ISO 8601." },
        { status: 400 }
      );
    }

    if (fromDate >= toDate) {
      return NextResponse.json(
        { error: "from must be before to" },
        { status: 400 }
      );
    }

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        dentistId,
        isBooked: false,
        isBlocked: false,
        startTime: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Group slots by date (YYYY-MM-DD)
    const grouped: Record<string, typeof slots> = {};
    for (const slot of slots) {
      const dateKey = slot.startTime.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    }

    return NextResponse.json({
      data: slots,
      grouped,
      total: slots.length,
    });
  } catch (error) {
    console.error("[GET /api/availability]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const slot = await prisma.availabilitySlot.findUnique({ where: { id }, include: { dentist: true } });
    if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isOwnSlots = slot.dentist.userId === session.user.id;
    const isAdmin = ["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role);
    if (!isOwnSlots && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.availabilitySlot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/availability]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/availability:
 *   post:
 *     summary: Create availability slots for a dentist
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dentistId, slots]
 *             properties:
 *               dentistId:
 *                 type: string
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [startTime, endTime]
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     recurrence:
 *                       type: string
 *                       enum: [NONE, DAILY, WEEKLY, BIWEEKLY]
 *     responses:
 *       201:
 *         description: Slots created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dentistId, slots } = body;

    if (!dentistId || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "dentistId and slots array are required" },
        { status: 422 }
      );
    }

    // Only the dentist or admins can manage availability
    const dentist = await prisma.dentist.findUnique({ where: { id: dentistId } });

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    const isOwnSlots = dentist.userId === session.user.id;
    const isAdmin = ["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role);

    if (!isOwnSlots && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate and create slots
    const validSlots = slots
      .filter((s: { startTime: string; endTime: string }) => s.startTime && s.endTime)
      .map((s: { startTime: string; endTime: string; recurrence?: string }) => ({
        dentistId,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
        recurrence: (s.recurrence as "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY") || "NONE",
      }));

    if (validSlots.length === 0) {
      return NextResponse.json(
        { error: "No valid slots provided" },
        { status: 422 }
      );
    }

    const created = await prisma.availabilitySlot.createMany({
      data: validSlots,
      skipDuplicates: true,
    });

    return NextResponse.json(
      { data: { count: created.count }, message: `${created.count} slot(s) created` },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/availability]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
