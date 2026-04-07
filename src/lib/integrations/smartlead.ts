const BASE = "https://server.smartlead.ai/api/v1";

export class SmartleadAuthError extends Error {
  constructor() { super("Invalid Smartlead API key. Check your key in Settings."); }
}

export class SmartleadError extends Error {
  constructor(message: string) { super(message); }
}

async function sl<T>(apiKey: string, path: string, options?: RequestInit): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });

  if (res.status === 401 || res.status === 403) throw new SmartleadAuthError();

  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = text; }

  if (!res.ok) {
    const msg = typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : `Smartlead API error ${res.status}`;
    throw new SmartleadError(msg);
  }

  return body as T;
}

export async function createCampaign(
  apiKey: string,
  name: string,
): Promise<{ id: number }> {
  return sl<{ id: number }>(apiKey, "/campaigns/create", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export interface SequenceStep {
  subject: string;
  body: string;
  /** Days to wait before sending (0 = send immediately for step 1) */
  waitDays: number;
}

export async function addSequenceStep(
  apiKey: string,
  campaignId: number,
  step: SequenceStep,
  seq: number,
): Promise<void> {
  await sl(apiKey, `/campaigns/${campaignId}/sequences`, {
    method: "POST",
    body: JSON.stringify({
      sequences: [
        {
          seq_number: seq,
          seq_delay_details: { delay_in_days: step.waitDays },
          subject: step.subject,
          email_body: step.body,
        },
      ],
    }),
  });
}
