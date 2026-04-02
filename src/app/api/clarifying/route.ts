import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { z } from "zod";

const schema = z.object({
  projectId: z.string(),
  answers: z.record(z.string(), z.string()), // { "question text": "answer" }
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, answers } = schema.parse(body);

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const existingQs = project.clarifyingQs as { questions: unknown[]; answers: Record<string, string> } | null;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        clarifyingQs: JSON.parse(JSON.stringify({
          questions: existingQs?.questions ?? [],
          answers,
        })),
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
