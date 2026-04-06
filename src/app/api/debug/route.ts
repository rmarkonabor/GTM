import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: DB connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.db = "ok";
  } catch (e) {
    results.db = `ERROR: ${(e as Error).message}`;
  }

  // Test 2: User table query
  try {
    const count = await prisma.user.count();
    results.userCount = count;
  } catch (e) {
    results.userTable = `ERROR: ${(e as Error).message}`;
  }

  // Test 3: Project table query
  try {
    const count = await prisma.project.count();
    results.projectCount = count;
  } catch (e) {
    results.projectTable = `ERROR: ${(e as Error).message}`;
  }

  // Test 4: Session
  try {
    const session = await getServerSession(authOptions);
    results.session = session ? { userId: session.user?.id, email: session.user?.email } : null;
  } catch (e) {
    results.session = `ERROR: ${(e as Error).message}`;
  }

  // Test 5: ProjectStep with draftOutput
  try {
    const step = await prisma.projectStep.findFirst({ select: { id: true, draftOutput: true } });
    results.draftOutputQuery = step ? "ok" : "no rows";
  } catch (e) {
    results.draftOutputQuery = `ERROR: ${(e as Error).message}`;
  }

  // Test 6: ProjectStepVersion table
  try {
    const count = await prisma.projectStepVersion.count();
    results.versionCount = count;
  } catch (e) {
    results.versionTable = `ERROR: ${(e as Error).message}`;
  }

  // Test 7: Full layout query (project with steps)
  try {
    const project = await prisma.project.findFirst({ include: { steps: true } });
    results.layoutQuery = project ? `ok - ${project.steps.length} steps` : "no projects";
  } catch (e) {
    results.layoutQuery = `ERROR: ${(e as Error).message}`;
  }

  return NextResponse.json(results);
}
