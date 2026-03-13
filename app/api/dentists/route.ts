import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @openapi
 * /api/dentists:
 *   get:
 *     summary: List dentists with optional search/filter
 *     tags: [Dentists]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Full-text search (name, specialty)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *       - in: query
 *         name: accepting
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Paginated list of dentists
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const specialty = searchParams.get("specialty") || "";
    const accepting = searchParams.get("accepting");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10))
    );
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      isActive: true,
      ...(accepting === "true" && { acceptingNew: true }),
      ...(specialty && {
        specialty: { has: specialty },
      }),
      ...(city && {
        clinic: { city: { contains: city, mode: "insensitive" } },
      }),
      ...(state && {
        clinic: { state: { contains: state, mode: "insensitive" } },
      }),
      ...(q && {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { specialty: { has: q } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      }),
    };

    const [dentists, total] = await Promise.all([
      prisma.dentist.findMany({
        where,
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              phone: true,
            },
          },
        },
        orderBy: [{ rating: "desc" }, { lastName: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.dentist.count({ where }),
    ]);

    return NextResponse.json({
      data: dentists,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/dentists]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/dentists:
 *   post:
 *     summary: Create a new dentist profile
 *     tags: [Dentists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDentistPayload'
 *     responses:
 *       201:
 *         description: Dentist created
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create dentist profiles
    if (!["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      specialty,
      bio,
      licenseNumber,
      yearsExp,
      clinicId,
      acceptingNew,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "firstName, lastName, and email are required" },
        { status: 422 }
      );
    }

    // Ensure the user account exists or create it
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: `${firstName} ${lastName}`, role: "DENTIST" },
      });
    }

    const dentist = await prisma.dentist.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        email,
        phone,
        specialty: specialty || [],
        bio,
        licenseNumber,
        yearsExp: yearsExp ? parseInt(yearsExp, 10) : undefined,
        clinicId: clinicId || undefined,
        acceptingNew: acceptingNew !== false,
      },
      include: { clinic: true },
    });

    return NextResponse.json({ data: dentist }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/dentists]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
