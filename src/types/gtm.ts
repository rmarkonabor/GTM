export type LLMProvider = "openai" | "anthropic" | "google";
export type TaskComplexity = "COMPLEX" | "MEDIUM" | "SIMPLE";

export interface LLMPreference {
  provider: LLMProvider;
  apiKey: string;
}

export interface DBPreferences {
  apollo?: { apiKey: string };
  clay?: { apiKey: string };
}

// ─── Company Research ───────────────────────────────────────────────────────

export interface CompanyProfile {
  name: string;
  website: string;
  description: string;
  businessType: "b2b_saas" | "agency" | "services" | "other";
  primaryProduct: string;
  targetAudience: string;
  geographicFocus: string;
  keyDifferentiators: string[];
  currentCustomerExamples: string[];
  techStack: string[];
  foundedYear?: number;
  teamSize?: string;
  fundingStage?: string;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  purpose: string;
  optional: boolean;
}

export interface ResearchOutput {
  companyProfile: CompanyProfile;
  questionsNeeded: ClarifyingQuestion[];
}

// ─── Target Markets ──────────────────────────────────────────────────────────

export interface TargetMarket {
  id: string;
  name: string;
  urgentProblems: string[];
  importantProblems: string[];
  macroTrends: string[];
  whyRightMarket: string;
  priorityScore: number; // 1-10
}

export interface TargetMarketsOutput {
  markets: TargetMarket[]; // max 5
}

// ─── Industry Priority ───────────────────────────────────────────────────────

export interface IndustryDefinition {
  industryName: string;
  priorityRank: number;
  painPoints: string[];
  whatClientOffers: string[];
  howTheyWorkTogether: string;
  estimatedMarketFit: "high" | "medium" | "low";
}

export interface IndustryPriorityOutput {
  targetMarketId: string;
  industries: IndustryDefinition[];
}

// ─── ICP ─────────────────────────────────────────────────────────────────────

export interface Firmographics {
  companySize: string[]; // e.g. ["11-50", "51-200"]
  revenue: string[]; // e.g. ["$1M-$10M"]
  geographies: string[];
  industries: string[];
  technologies: string[];
  businessModels: string[];
}

export interface BuyerPersona {
  title: string;
  seniorities: string[]; // e.g. ["vp", "director"]
  departments: string[];
  goals: string[];
  challenges: string[];
  triggerEvents: string[];
}

export interface ICPDefinition {
  industryName: string;
  firmographics: Firmographics;
  buyerPersonas: BuyerPersona[];
}

export interface ICPOutput {
  icps: ICPDefinition[];
}

// ─── Segmentation ────────────────────────────────────────────────────────────

export interface Segment {
  id: string;
  name: string;
  sizeCategory: "enterprise" | "mid-market" | "smb" | "startup";
  geographies: string[];
  industries: string[];
  estimatedPriority: "tier-1" | "tier-2" | "tier-3";
  rationale: string;
}

export interface SegmentationOutput {
  segments: Segment[];
}

// ─── Market Sizing ───────────────────────────────────────────────────────────

export interface MarketSizeResult {
  segmentId: string;
  segmentName: string;
  database: "apollo" | "clay";
  // Company level
  tam_companies: number;
  sam_companies: number;
  som_companies: number;
  // Persona level
  tam_contacts: number;
  sam_contacts: number;
  som_contacts: number;
  filtersUsed: Record<string, unknown>;
  fetchedAt: string;
}

export interface MarketSizingOutput {
  results: MarketSizeResult[];
  totalTAM_companies: number;
  totalSAM_companies: number;
  totalSOM_companies: number;
}

// ─── Competitive Analysis ────────────────────────────────────────────────────

export interface Competitor {
  name: string;
  domain: string;
  location: string;
  valueProp: string;
  keyOfferings: string[];
  whereTheyWin: string[];
  whereClientWins: string[];
  targetSegment: string; // which segment/industry they compete in
  pricingModel?: string;
}

export interface CompetitiveAnalysisOutput {
  // For B2B SaaS: one list; for agency/services: keyed by industry
  competitors: Competitor[];
  isIndustrySpecific: boolean;
  byIndustry?: Record<string, Competitor[]>;
}

// ─── Positioning ─────────────────────────────────────────────────────────────

export interface PositioningOutput {
  uniqueValueProp: string;
  differentiationPoints: string[];
  positioningStatement: string;
  bySegment: Array<{
    segmentName: string;
    keyPlayers: string[];
    differentiationAngle: string;
  }>;
}

// ─── Manifesto / Messaging ───────────────────────────────────────────────────

export interface ManifestoOutput {
  who: string;               // target audience
  whyExist: string;          // why the company exists
  whatTheyDo: string;        // what the product/service does
  whyChooseThem: string;     // why buyers should choose them over competitors
  tagline: string;
  elevatorPitch: string;     // 2-3 sentence version
  messagingPillars: Array<{
    pillar: string;
    headline: string;
    supportingPoints: string[];
  }>;
}

// ─── Step orchestration ──────────────────────────────────────────────────────

export type StepOutputMap = {
  RESEARCH: ResearchOutput;
  TARGET_MARKETS: TargetMarketsOutput;
  INDUSTRY_PRIORITY: IndustryPriorityOutput[];
  ICP: ICPOutput;
  SEGMENTATION: SegmentationOutput;
  MARKET_SIZING: MarketSizingOutput;
  COMPETITIVE: CompetitiveAnalysisOutput;
  POSITIONING: PositioningOutput;
  MANIFESTO: ManifestoOutput;
};

export interface WorkflowContext {
  projectId: string;
  websiteUrl: string;
  companyProfile: CompanyProfile;
  clarifyingAnswers: Record<string, string>;
  businessType: string;
  steps: Partial<StepOutputMap>;
}
