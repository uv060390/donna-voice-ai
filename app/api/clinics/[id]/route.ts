import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

/**
 * @openapi
 * /api/clinics/{id}:
 *   get:
 *     summary: Get a clinic by ID
 *     tags: [Clinics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clinic with dentists
 *       404:
 *         description: Not found
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: params.id },
      include: {
        dentists: {
          where: { isActive: true },
          include: {
            availabilitySlots: {
              where: {
                isBooked: false,
                isBlocked: false,
                startTime: { gte: new Date() },
              },
              take: 5,
              orderBy: { startTime: "asc" },
            },
          },
        },
        _count: { select: { dentists: true, appointments: true } },
      },
    });

    if (!clinic || !clinic.isActive) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json({ data: clinic });
  } catch (error) {
    console.error("[GET /api/clinics/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/clinics/{id}:
 *   patch:
 *     summary: Update a clinic
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated clinic
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: params.id } });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const body = await req.json();
    const allowedFields = [
      "name",
      "description",
      "address",
      "city",
      "state",
      "zipCode",
      "phone",
      "email",
      "website",
      "timezone",
      "logoUrl",
      "isActive",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await prisma.clinic.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/clinics/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
