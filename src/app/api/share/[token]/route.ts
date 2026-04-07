import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const project = await prisma.project.findFirst({
      where: { shareToken: token },
      include: { steps: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "This shared link is invalid or has been revoked." } },
        { status: 404 }
      );
    }

    // Strip sensitive data — only return what the public dashboard needs
    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        companyProfile: project.companyProfile,
        status: project.status,
        steps: project.steps.map((s) => ({
          stepName: s.stepName,
          status: s.status,
          output: s.output,
          draftOutput: s.draftOutput,
        })),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
