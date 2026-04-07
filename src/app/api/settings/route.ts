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
  smartlead: z.object({
    apiKey: z.string().min(1, "API key is required"),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const body = await req.json();
    const { llm, smartlead } = schema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (llm) updateData.llmPreference = encrypt(JSON.stringify(llm));
    if (smartlead) updateData.smartleadPreference = encrypt(JSON.stringify(smartlead));

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Nothing to save." } }, { status: 400 });
    }

    await prisma.user.update({ where: { id: session.user.id }, data: updateData });

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

    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    const llmParsed = llmRaw ? (JSON.parse(llmRaw) as { provider: string; apiKey: string }) : null;

    const slRaw = safeDecrypt(user?.smartleadPreference ?? null);
    const slParsed = slRaw ? (JSON.parse(slRaw) as { apiKey: string }) : null;

    return NextResponse.json({
      llm: llmParsed ? { provider: llmParsed.provider, apiKey: llmParsed.apiKey } : null,
      smartlead: slParsed ? { apiKey: slParsed.apiKey } : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
