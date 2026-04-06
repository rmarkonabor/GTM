import {
  ApolloRateLimitError,
  ApolloAuthError,
  DatabaseApiError,
} from "@/lib/errors/types";
import { Firmographics, BuyerPersona } from "@/types/gtm";

const APOLLO_API_URL = "https://api.apollo.io/v1";

interface ApolloSearchResult {
  totalCompanies: number;
  totalContacts: number;
  pagination: { totalEntries: number };
}

// Maps our firmographics to Apollo's filter schema
function buildApolloFilters(
  firmographics: Firmographics,
  persona?: BuyerPersona
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  // Note: organization_industry_tag_ids requires numeric Apollo tag IDs.
  // We omit industry filtering here to avoid sending invalid string values.
  // Company size, geography, and technology filters provide sufficient scoping.

  if (firmographics.companySize?.length) {
    // Apollo uses "min,max" format, e.g. "11,50"
    filters.organization_num_employees_ranges = firmographics.companySize.map((range) => {
      // Convert "11-50" → "11,50"
      return range.replace("-", ",").replace("+", ",");
    });
  }

  if (firmographics.geographies?.length) {
    filters.organization_locations = firmographics.geographies;
  }

  if (firmographics.technologies?.length) {
    filters.organization_technology_names = firmographics.technologies;
  }

  if (persona) {
    if (persona.title) {
      filters.person_titles = [persona.title];
    }
    if (persona.seniorities?.length) {
      filters.person_seniorities = persona.seniorities;
    }
    if (persona.departments?.length) {
      filters.person_departments = persona.departments;
    }
  }

  return filters;
}

async function apolloPost(
  apiKey: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ pagination?: { total_entries?: number } }> {
  const response = await fetch(`${APOLLO_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      // Apollo v1 accepts the key via header or body; include both for reliability
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({ ...body, api_key: apiKey, page: 1, per_page: 1 }),
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
      `Apollo API error ${response.status}: ${text}`,
      "APOLLO_API_ERROR"
    );
  }

  return response.json();
}

// Build company-level (accounts) filters — no persona fields
function buildAccountFilters(firmographics: Firmographics): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (firmographics.companySize?.length) {
    filters.organization_num_employees_ranges = firmographics.companySize.map((r) =>
      r.replace("-", ",").replace("+", ",")
    );
  }

  if (firmographics.geographies?.length) {
    filters.organization_locations = firmographics.geographies;
  }

  if (firmographics.technologies?.length) {
    filters.organization_technology_names = firmographics.technologies;
  }

  return filters;
}

export async function getMarketSize(
  apiKey: string,
  firmographics: Firmographics,
  persona?: BuyerPersona
): Promise<{ companies: number; contacts: number; filtersUsed: Record<string, unknown> }> {
  const personaFilters = buildApolloFilters(firmographics, persona);
  const accountFilters = buildAccountFilters(firmographics);

  // Run both queries in parallel
  // People count: /mixed_people/search; Company count: /organizations/search
  const [peopleData, accountsData] = await Promise.all([
    apolloPost(apiKey, "/mixed_people/search", personaFilters),
    apolloPost(apiKey, "/organizations/search", accountFilters),
  ]);

  // Apollo returns counts in pagination.total_entries
  const contacts = peopleData.pagination?.total_entries ?? 0;
  const companies = accountsData.pagination?.total_entries ?? 0;

  return { companies, contacts, filtersUsed: personaFilters };
}

export async function testApolloKey(apiKey: string): Promise<boolean> {
  try {
    await apolloPost(apiKey, "/organizations/search", {});
    return true;
  } catch (err) {
    if (err instanceof ApolloAuthError) return false;
    return true; // other errors (rate limit etc.) mean key is valid
  }
}
