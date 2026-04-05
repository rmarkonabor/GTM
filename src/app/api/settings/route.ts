import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { encrypt, safeDecrypt } from "@/lib/crypto";
import { z } from "zod";

const schema = z.object({
  llm: z.object({
    provider: z.enum(["openai", "anthropic", "google"]),
    apiKey: z.string().min(1, "API key is required"),
  }).optional(),
  databases: z.object({
    apollo: z.object({ apiKey: z.string() }).optional(),
    clay: z.object({ apiKey: z.string() }).optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const body = await req.json();
    const { llm, databases } = schema.parse(body);

    const updates: Record<string, string> = {};

    if (llm) {
      updates.llmPreference = encrypt(JSON.stringify(llm));
    }

    if (databases) {
      updates.dbPreferences = encrypt(JSON.stringify(databases));
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    // Return whether keys exist (never return the actual keys to client)
    const hasLlm = !!user?.llmPreference;
    const dbRaw = safeDecrypt(user?.dbPreferences ?? null);
    const dbParsed = dbRaw ? (JSON.parse(dbRaw) as Record<string, unknown>) : {};
    const hasApollo = !!(dbParsed.apollo as { apiKey?: string } | undefined)?.apiKey;
    const hasClay = !!(dbParsed.clay as { apiKey?: string } | undefined)?.apiKey;

    return NextResponse.json({ hasLlm, hasApollo, hasClay });
  } catch (err) {
    return errorResponse(err);
  }
}
