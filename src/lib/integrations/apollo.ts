import {
  ApolloRateLimitError,
  ApolloAuthError,
  DatabaseApiError,
} from "@/lib/errors/types";
import { Firmographics, BuyerPersona } from "@/types/gtm";

// Apollo v1 base — note the /api/v1 path (not /v1)
const APOLLO_BASE = "https://api.apollo.io/api/v1";

// Convert human-readable technology names to Apollo UID format (lowercase, underscores)
function toTechUid(name: string): string {
  return name.toLowerCase().replace(/[\s.]+/g, "_");
}

async function apolloPost(
  apiKey: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`${APOLLO_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ ...body, page: 1, per_page: 1 }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new ApolloAuthError();
  }

  if (response.status === 429) {
    throw new ApolloRateLimitError();
  }

  if (!response.ok) {
    const text = await response.text();
    throw new DatabaseApiError(
      `Apollo API error ${response.status}: ${text.slice(0, 300)}`,
      "APOLLO_API_ERROR"
    );
  }

  return response.json();
}

export async function getMarketSize(
  apiKey: string,
  firmographics: Firmographics,
  persona?: BuyerPersona
): Promise<{ companies: number; contacts: number; filtersUsed: Record<string, unknown> }> {
  // --- People / contact filters ---
  // Keys must NOT have [] suffix when sending JSON body ([] is query-string/form-data notation only)
  const peopleFilters: Record<string, unknown> = {};

  if (firmographics.companySize?.length) {
    peopleFilters.organization_num_employees_ranges = firmographics.companySize.map((r) =>
      r.replace("-", ",").replace("+", ",")
    );
  }
  if (firmographics.geographies?.length) {
    peopleFilters.organization_locations = firmographics.geographies;
  }
  if (firmographics.technologies?.length) {
    peopleFilters.currently_using_any_of_technology_uids = firmographics.technologies.map(toTechUid);
  }
  if (firmographics.apolloKeywordTags?.length) {
    peopleFilters.q_organization_keyword_tags = firmographics.apolloKeywordTags;
  }
  if (persona?.title) {
    peopleFilters.person_titles = [persona.title];
  }
  if (persona?.seniorities?.length) {
    peopleFilters.person_seniorities = persona.seniorities;
  }

  // --- Organization / company filters ---
  const orgFilters: Record<string, unknown> = {};

  if (firmographics.companySize?.length) {
    orgFilters.organization_num_employees_ranges = firmographics.companySize.map((r) =>
      r.replace("-", ",").replace("+", ",")
    );
  }
  if (firmographics.geographies?.length) {
    orgFilters.organization_locations = firmographics.geographies;
  }
  if (firmographics.technologies?.length) {
    orgFilters.currently_using_any_of_technology_uids = firmographics.technologies.map(toTechUid);
  }
  if (firmographics.apolloKeywordTags?.length) {
    orgFilters.q_organization_keyword_tags = firmographics.apolloKeywordTags;
  }

  // Run both queries in parallel:
  //   People: POST /mixed_people/api_search  → total at response.total_entries (root)
  //   Orgs:   POST /mixed_companies/search   → total at response.pagination.total_entries
  const [peopleData, orgData] = await Promise.all([
    apolloPost(apiKey, "/mixed_people/api_search", peopleFilters) as Promise<{
      total_entries?: number;
    }>,
    apolloPost(apiKey, "/mixed_companies/search", orgFilters) as Promise<{
      pagination?: { total_entries?: number };
    }>,
  ]);

  const contacts = peopleData.total_entries ?? 0;
  const companies = orgData.pagination?.total_entries ?? 0;

  return { companies, contacts, filtersUsed: { ...peopleFilters, ...orgFilters } };
}

export async function testApolloKey(apiKey: string): Promise<boolean> {
  try {
    await apolloPost(apiKey, "/mixed_people/api_search", {});
    return true;
  } catch (err) {
    if (err instanceof ApolloAuthError) return false;
    return true; // rate limits / other errors = key is valid
  }
}
