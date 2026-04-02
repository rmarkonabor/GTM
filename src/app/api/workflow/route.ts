import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { inngest } from "@/../inngest/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference, DBPreferences } from "@/types/gtm";
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

    const [project, user] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);

    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    if (!llmRaw) {
      return NextResponse.json(
        { error: { code: "LLM_NOT_CONFIGURED", message: "Please configure your LLM provider in Settings." } },
        { status: 400 }
      );
    }

    const llmPreference = JSON.parse(llmRaw) as LLMPreference;
    const dbRaw = safeDecrypt(user?.dbPreferences ?? null);
    const dbPreferences: DBPreferences = dbRaw ? JSON.parse(dbRaw) : {};

    await inngest.send({
      name: "gtm/workflow.start",
      data: { projectId, llmPreference, dbPreferences },
    });

    return NextResponse.json({ success: true, message: "Workflow started." });
  } catch (err) {
    return errorResponse(err);
  }
}
