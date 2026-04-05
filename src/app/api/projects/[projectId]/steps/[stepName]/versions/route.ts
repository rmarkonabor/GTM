export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; stepName: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, stepName } = await params;

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });

    const versions = await prisma.projectStepVersion.findMany({
      where: { projectId, stepName: stepName as never },
      orderBy: { versionNum: "desc" },
    });

    return NextResponse.json({ versions });
  } catch (err) {
    return errorResponse(err);
  }
}
