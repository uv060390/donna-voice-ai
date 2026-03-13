import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @openapi
 * /api/clinics:
 *   get:
 *     summary: List all active clinics
 *     tags: [Clinics]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of clinics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";

    const clinics = await prisma.clinic.findMany({
      where: {
        isActive: true,
        ...(city && { city: { contains: city, mode: "insensitive" } }),
        ...(state && { state: { contains: state, mode: "insensitive" } }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        dentists: {
          where: { isActive: true },
          select: { id: true, firstName: true, lastName: true, specialty: true },
        },
        _count: { select: { dentists: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: clinics, total: clinics.length });
  } catch (error) {
    console.error("[GET /api/clinics]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/clinics:
 *   post:
 *     summary: Create a new clinic
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Clinic created
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "CLINIC_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      website,
      timezone,
      description,
    } = body;

    if (!name || !address || !city || !state || !zipCode || !phone || !email) {
      return NextResponse.json(
        {
          error:
            "name, address, city, state, zipCode, phone, and email are required",
        },
        { status: 422 }
      );
    }

    // Generate slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await prisma.clinic.count({
      where: { slug: { startsWith: baseSlug } },
    });
    const slug = existing > 0 ? `${baseSlug}-${existing + 1}` : baseSlug;

    const clinic = await prisma.clinic.create({
      data: {
        name,
        slug,
        address,
        city,
        state,
        zipCode,
        country: country || "US",
        phone,
        email,
        website,
        timezone: timezone || "America/New_York",
        description,
      },
    });

    return NextResponse.json({ data: clinic }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clinics]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
