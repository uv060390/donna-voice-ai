import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

/**
 * @openapi
 * /api/dentists/{id}:
 *   get:
 *     summary: Get a dentist by ID
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dentist object
 *       404:
 *         description: Dentist not found
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const dentist = await prisma.dentist.findUnique({
      where: { id: params.id },
      include: {
        clinic: true,
        availabilitySlots: {
          where: {
            isBooked: false,
            isBlocked: false,
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 30,
        },
      },
    });

    if (!dentist || !dentist.isActive) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    return NextResponse.json({ data: dentist });
  } catch (error) {
    console.error("[GET /api/dentists/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/dentists/{id}:
 *   patch:
 *     summary: Update a dentist profile
 *     tags: [Dentists]
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
 *         description: Updated dentist
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dentist = await prisma.dentist.findUnique({
      where: { id: params.id },
    });

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    // Only the dentist themselves or admins can update
    const isOwnProfile = dentist.userId === session.user.id;
    const isAdmin = ["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role);

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "specialty",
      "bio",
      "licenseNumber",
      "yearsExp",
      "avatarUrl",
      "acceptingNew",
      "clinicId",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await prisma.dentist.update({
      where: { id: params.id },
      data: updateData,
      include: { clinic: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/dentists/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/dentists/{id}:
 *   delete:
 *     summary: Deactivate a dentist profile
 *     tags: [Dentists]
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
 *         description: Dentist deactivated
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

    if (!["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dentist = await prisma.dentist.findUnique({
      where: { id: params.id },
    });

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    // Soft delete — set isActive = false
    await prisma.dentist.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Dentist deactivated successfully" });
  } catch (error) {
    console.error("[DELETE /api/dentists/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
