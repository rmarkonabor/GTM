import {
  ApolloRateLimitError,
  ApolloAuthError,
  DatabaseApiError,
} from "@/lib/errors/types";
import { Firmographics, BuyerPersona, CompanyPreview } from "@/types/gtm";

// Apollo v1 base — note the /api/v1 path (not /v1)
const APOLLO_BASE = "https://api.apollo.io/api/v1";

// Convert human-readable technology names to Apollo UID format (lowercase, underscores)
function toTechUid(name: string): string {
  return name.toLowerCase().replace(/[\s.]+/g, "_");
}

async function apolloPost(
  apiKey: string,
  endpoint: string,
  body: Record<string, unknown>,
  perPage = 1
): Promise<unknown> {
  const response = await fetch(`${APOLLO_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ ...body, page: 1, per_page: perPage }),
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

// Shape an Apollo organization record into our CompanyPreview
interface ApolloOrg {
  name?: string;
  industry?: string;
  estimated_num_employees?: number;
  annual_revenue_printed?: string;
  city?: string;
  state?: string;
  country?: string;
  primary_domain?: string;
  linkedin_url?: string;
}

function toCompanyPreview(org: ApolloOrg): CompanyPreview {
  const location = [org.city, org.state, org.country].filter(Boolean).join(", ");
  return {
    name: org.name ?? "",
    industry: org.industry ?? "",
    employeeCount: org.estimated_num_employees ? String(org.estimated_num_employees) : "",
    revenue: org.annual_revenue_printed ?? "",
    location,
    domain: org.primary_domain ?? "",
    linkedinUrl: org.linkedin_url ?? "",
  };
}

export async function getMarketSize(
  apiKey: string,
  firmographics: Firmographics,
  persona?: BuyerPersona
): Promise<{ companies: number; contacts: number; filtersUsed: Record<string, unknown>; companyPreview: CompanyPreview[] }> {
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
  //   People (per_page=1): just need the total count
  //   Orgs (per_page=100): Apollo's max — get as many companies as possible in one call
  const [peopleData, orgData] = await Promise.all([
    apolloPost(apiKey, "/mixed_people/api_search", peopleFilters, 1) as Promise<{
      total_entries?: number;
    }>,
    apolloPost(apiKey, "/mixed_companies/search", orgFilters, 100) as Promise<{
      pagination?: { total_entries?: number };
      organizations?: ApolloOrg[];
    }>,
  ]);

  const contacts = peopleData.total_entries ?? 0;
  const companies = orgData.pagination?.total_entries ?? 0;
  const companyPreview = (orgData.organizations ?? []).map(toCompanyPreview);

  return { companies, contacts, filtersUsed: { ...peopleFilters, ...orgFilters }, companyPreview };
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
