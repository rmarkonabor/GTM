import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { redirect, notFound } from "next/navigation";

const STEP_PATHS: Record<string, string> = {
  RESEARCH: "research",
  TARGET_MARKETS: "target-markets",
  INDUSTRY_PRIORITY: "industry-priority",
  ICP: "icp",
  SEGMENTATION: "segmentation",
  MARKET_SIZING: "market-sizing",
  COMPETITIVE: "competitive-analysis",
  POSITIONING: "positioning",
  MANIFESTO: "manifesto",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [session, { projectId }] = await Promise.all([
    getServerSession(authOptions),
    params,
  ]);
  if (!session) redirect("/sign-in");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user!.id! },
    include: { steps: { orderBy: { updatedAt: "asc" } } },
  });

  if (!project) notFound();

  // Redirect to the most recently active/errored step, or research
  const activeStep = project.steps.find((s) => s.status === "RUNNING" || s.status === "ERROR");
  const firstComplete = project.steps.find((s) => s.status === "COMPLETE");
  const targetStep = activeStep ?? firstComplete;

  if (targetStep) {
    redirect(`/projects/${projectId}/${STEP_PATHS[targetStep.stepName]}`);
  }

  redirect(`/projects/${projectId}/research`);
}
