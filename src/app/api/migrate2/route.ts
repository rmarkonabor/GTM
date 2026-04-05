import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: string[] = [];

  // Add AWAITING_APPROVAL to StepStatus enum
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "StepStatus" ADD VALUE IF NOT EXISTS 'AWAITING_APPROVAL' AFTER 'RUNNING'`);
    results.push("Added AWAITING_APPROVAL to StepStatus");
  } catch (e) { results.push(`StepStatus enum: ${(e as Error).message}`); }

  // Add draftOutput column
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ProjectStep" ADD COLUMN IF NOT EXISTS "draftOutput" JSONB`);
    results.push("Added draftOutput column");
  } catch (e) { results.push(`draftOutput column: ${(e as Error).message}`); }

  // Create ProjectStepVersion table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectStepVersion" (
        "id" TEXT NOT NULL,
        "projectId" TEXT NOT NULL,
        "stepName" "StepName" NOT NULL,
        "versionNum" INTEGER NOT NULL,
        "output" JSONB NOT NULL,
        "prompt" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProjectStepVersion_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("Created ProjectStepVersion table");
  } catch (e) { results.push(`ProjectStepVersion table: ${(e as Error).message}`); }

  // Create index
  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProjectStepVersion_projectId_stepName_idx" ON "ProjectStepVersion"("projectId", "stepName")`);
    results.push("Created index");
  } catch (e) { results.push(`Index: ${(e as Error).message}`); }

  return NextResponse.json({ results });
}
