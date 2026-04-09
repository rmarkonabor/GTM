import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// This one-time migration route has been superseded by Prisma migrations.
// It is permanently disabled to prevent unauthorized DDL execution.
export async function GET() {
  return NextResponse.json({ error: "Gone." }, { status: 410 });
}
