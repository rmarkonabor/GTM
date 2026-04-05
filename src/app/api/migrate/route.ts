import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// One-time migration endpoint — remove after use
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steps: { sql: string; result?: string; error?: string }[] = [];

  const run = async (label: string, sql: string) => {
    try {
      await prisma.$executeRawUnsafe(sql);
      steps.push({ sql: label, result: "OK" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Ignore "already exists" errors
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        steps.push({ sql: label, result: "SKIPPED (already exists)" });
      } else {
        steps.push({ sql: label, error: msg });
      }
    }
  };

  await run("CREATE TYPE ProjectStatus", `CREATE TYPE "ProjectStatus" AS ENUM ('RESEARCHING', 'CLARIFYING', 'IN_PROGRESS', 'COMPLETE', 'ERROR')`);
  await run("CREATE TYPE StepName", `CREATE TYPE "StepName" AS ENUM ('RESEARCH', 'TARGET_MARKETS', 'INDUSTRY_PRIORITY', 'ICP', 'SEGMENTATION', 'MARKET_SIZING', 'COMPETITIVE', 'POSITIONING', 'MANIFESTO')`);
  await run("CREATE TYPE StepStatus", `CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'ERROR')`);

  await run("ADD Project.status", `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "status" "ProjectStatus" NOT NULL DEFAULT 'RESEARCHING'`);
  await run("ADD Project.businessType", `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "businessType" TEXT`);
  await run("ADD Project.clarifyingQs", `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "clarifyingQs" JSONB`);
  await run("ADD Project.companyProfile", `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "companyProfile" JSONB`);
  await run("ADD Project.name", `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "name" TEXT`);
  await run("ADD User.llmPreference", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "llmPreference" TEXT`);
  await run("ADD User.dbPreferences", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dbPreferences" TEXT`);

  await run("CREATE TABLE ProjectStep", `
    CREATE TABLE IF NOT EXISTS "ProjectStep" (
      "id" TEXT NOT NULL,
      "projectId" TEXT NOT NULL,
      "stepName" "StepName" NOT NULL,
      "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
      "output" JSONB,
      "errorCode" TEXT,
      "errorMsg" TEXT,
      "startedAt" TIMESTAMP(3),
      "completedAt" TIMESTAMP(3),
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjectStep_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("INDEX ProjectStep_projectId", `CREATE INDEX IF NOT EXISTS "ProjectStep_projectId_idx" ON "ProjectStep"("projectId")`);
  await run("UNIQUE ProjectStep_projectId_stepName", `CREATE UNIQUE INDEX IF NOT EXISTS "ProjectStep_projectId_stepName_key" ON "ProjectStep"("projectId", "stepName")`);
  await run("FK ProjectStep -> Project", `
    DO $$ BEGIN
      ALTER TABLE "ProjectStep" ADD CONSTRAINT "ProjectStep_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  const hasErrors = steps.some((s) => s.error);
  return NextResponse.json({ success: !hasErrors, steps }, { status: hasErrors ? 500 : 200 });
}
