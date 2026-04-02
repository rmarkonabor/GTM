import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { redirect, notFound } from "next/navigation";
import { ProjectStepNav } from "@/components/layout/ProjectStepNav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const [session, { projectId }] = await Promise.all([
    getServerSession(authOptions),
    params,
  ]);
  if (!session) redirect("/sign-in");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user!.id! },
    include: { steps: true },
  });

  if (!project) notFound();

  return (
    <div className="flex h-full">
      <ProjectStepNav project={project as Parameters<typeof ProjectStepNav>[0]["project"]} />
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </div>
  );
}
