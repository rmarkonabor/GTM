import { ClayTimeoutError, DatabaseApiError } from "@/lib/errors/types";
import { Firmographics } from "@/types/gtm";

const CLAY_API_URL = "https://api.clay.com/v1";
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30; // 60 seconds max

interface ClaySearchResult {
  status: "pending" | "running" | "complete" | "error";
  rowCount?: number;
  rows?: unknown[];
  error?: string;
}

export async function getMarketSizeClay(
  apiKey: string,
  tableId: string,
  firmographics: Firmographics
): Promise<{ companies: number; filtersUsed: Record<string, unknown> }> {
  // Step 1: Trigger search
  const filters = buildClayFilters(firmographics);

  let triggerResponse: Response;
  try {
    triggerResponse = await fetch(`${CLAY_API_URL}/tables/${tableId}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ filters }),
    });
  } catch (err) {
    throw new ClayTimeoutError();
  }

  if (!triggerResponse.ok) {
    if (triggerResponse.status === 401 || triggerResponse.status === 403) {
      throw new DatabaseApiError(
        "Invalid Clay API key. Please check your settings.",
        "CLAY_AUTH_ERROR"
      );
    }
    throw new DatabaseApiError(
      `Clay API error: ${triggerResponse.status}`,
      "CLAY_API_ERROR"
    );
  }

  const { searchId } = await triggerResponse.json();

  // Step 2: Poll for results
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const pollResponse = await fetch(
      `${CLAY_API_URL}/tables/${tableId}/search/${searchId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!pollResponse.ok) continue;

    const result: ClaySearchResult = await pollResponse.json();

    if (result.status === "complete") {
      return {
        companies: result.rowCount ?? result.rows?.length ?? 0,
        filtersUsed: filters,
      };
    }

    if (result.status === "error") {
      throw new DatabaseApiError(
        `Clay search failed: ${result.error ?? "unknown error"}`,
        "CLAY_SEARCH_ERROR"
      );
    }
  }

  throw new ClayTimeoutError();
}

function buildClayFilters(firmographics: Firmographics): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (firmographics.industries?.length) {
    filters.industry = { in: firmographics.industries };
  }
  if (firmographics.companySize?.length) {
    filters.employee_count_range = { in: firmographics.companySize };
  }
  if (firmographics.geographies?.length) {
    filters.location = { in: firmographics.geographies };
  }
  if (firmographics.technologies?.length) {
    filters.technologies = { contains_any: firmographics.technologies };
  }

  return filters;
}

export async function testClayKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${CLAY_API_URL}/tables`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok || response.status !== 401;
  } catch {
    return false;
  }
}
