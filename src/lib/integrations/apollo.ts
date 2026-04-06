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

async function apolloRequest(
  apiKey: string,
  filters: Record<string, unknown>,
  perPage = 1
): Promise<{ organizations_count?: number; people_count?: number }> {
  const response = await fetch(`${APOLLO_API_URL}/mixed_people/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      ...filters,
      page: 1,
      per_page: perPage,
    }),
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

export async function getMarketSize(
  apiKey: string,
  firmographics: Firmographics,
  persona?: BuyerPersona
): Promise<{ companies: number; contacts: number; filtersUsed: Record<string, unknown> }> {
  const filters = buildApolloFilters(firmographics, persona);

  const data = await apolloRequest(apiKey, filters);

  const companies = data.organizations_count ?? 0;
  const contacts = data.people_count ?? 0;

  return { companies, contacts, filtersUsed: filters };
}

export async function testApolloKey(apiKey: string): Promise<boolean> {
  try {
    await apolloRequest(apiKey, {}, 1);
    return true;
  } catch (err) {
    if (err instanceof ApolloAuthError) return false;
    return true; // other errors (rate limit etc.) mean key is valid
  }
}
