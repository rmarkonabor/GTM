import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { z } from "zod";

const createProjectSchema = z.object({
  websiteUrl: z.string().url("Must be a valid URL"),
  name: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: { steps: { select: { stepName: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const body = await req.json();
    const { websiteUrl, name } = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        websiteUrl,
        name: name ?? new URL(websiteUrl).hostname,
        status: "RESEARCHING",
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
