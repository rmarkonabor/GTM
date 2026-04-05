export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { inngest } from "@/../inngest/client";
import { errorResponse } from "@/lib/errors/handlers";
import { z } from "zod";

const schema = z.object({ projectId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = schema.parse(body);

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    await prisma.project.update({ where: { id: projectId }, data: { status: "IN_PROGRESS" } });
    await inngest.send({ name: "gtm/workflow.start", data: { projectId } });

    return NextResponse.json({ success: true, message: "Workflow started." });
  } catch (err) {
    return errorResponse(err);
  }
}
