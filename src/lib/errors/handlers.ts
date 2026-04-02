import { NextResponse } from "next/server";
import { getErrorDetails } from "./types";

export function errorResponse(err: unknown, status = 500): NextResponse {
  const { code, message } = getErrorDetails(err);
  console.error(`[GTM Error] ${code}:`, err);
  return NextResponse.json({ error: { code, message } }, { status });
}
