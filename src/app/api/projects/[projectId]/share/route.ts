import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { randomBytes } from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true, shareToken: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    // Toggle: if already shared, generate a new token; use DELETE to revoke
    const token = randomBytes(24).toString("base64url");
    await prisma.project.update({
      where: { id: projectId },
      data: { shareToken: token },
    });

    return NextResponse.json({ shareToken: token });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { shareToken: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { shareToken: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ shareToken: project.shareToken });
  } catch (err) {
    return errorResponse(err);
  }
}
