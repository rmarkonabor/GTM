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

export async function createCampaign(apiKey: string, name: string): Promise<{ id: number }> {
  return sl<{ id: number }>(apiKey, "/campaigns/create", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export interface StepVariant {
  id: string;
  subject: string;
  body: string;
}

function toEmailHtml(text: string): string {
  // Convert plain-text line breaks to HTML so Smartlead renders spacing correctly.
  // Double newlines → paragraph break; single newlines → <br>.
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

export async function addSequenceStep(
  apiKey: string,
  campaignId: number,
  step: { waitDays: number; variants: StepVariant[] },
  seq: number,
): Promise<void> {
  const [primary, ...rest] = step.variants;
  if (!primary) return; // nothing to send

  const seqObj: Record<string, unknown> = {
    seq_number: seq,
    seq_delay_details: { delay_in_days: step.waitDays },
    subject: primary.subject,
    email_body: toEmailHtml(primary.body),
  };

  if (rest.length > 0) {
    seqObj["seq_variants"] = rest.map((v) => ({
      subject: v.subject,
      email_body: toEmailHtml(v.body),
    }));
  }

  await sl(apiKey, `/campaigns/${campaignId}/sequences`, {
    method: "POST",
    body: JSON.stringify({ sequences: [seqObj] }),
  });
}

export interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  status: string;
}

interface RawStats {
  total_sent_count?: number;
  sent_count?: number;
  unique_opened_count?: number;
  opened_count?: number;
  click_count?: number;
  reply_count?: number;
  bounced_count?: number;
  open_percentage?: number;
  click_percentage?: number;
  reply_percentage?: number;
}

interface RawCampaign {
  status?: string;
}

export async function getCampaignStats(apiKey: string, campaignId: number): Promise<CampaignStats> {
  const [stats, campaign] = await Promise.all([
    sl<RawStats>(apiKey, `/campaigns/${campaignId}/statistics`).catch(() => ({} as RawStats)),
    sl<RawCampaign>(apiKey, `/campaigns/${campaignId}`).catch(() => ({} as RawCampaign)),
  ]);

  const sent = stats.total_sent_count ?? stats.sent_count ?? 0;
  const opened = stats.unique_opened_count ?? stats.opened_count ?? 0;
  const clicked = stats.click_count ?? 0;
  const replied = stats.reply_count ?? 0;
  const bounced = stats.bounced_count ?? 0;

  return {
    sent,
    opened,
    clicked,
    replied,
    bounced,
    openRate: stats.open_percentage ?? (sent > 0 ? Math.round((opened / sent) * 100) : 0),
    clickRate: stats.click_percentage ?? (sent > 0 ? Math.round((clicked / sent) * 100) : 0),
    replyRate: stats.reply_percentage ?? (sent > 0 ? Math.round((replied / sent) * 100) : 0),
    status: campaign.status ?? "UNKNOWN",
  };
}
