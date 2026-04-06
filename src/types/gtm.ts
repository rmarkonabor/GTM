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

// ─── Industry Priority ───────────────────────────────────────────────────────
// Runs first (before ICP and Target Markets) — identifies which industries
// the company should target, using database-compatible classifications.

export interface IndustryDefinition {
  standardIndustry: string;   // Apollo/LinkedIn-compatible: "Computer Software", "Financial Services"
  niche: string;              // Sub-segment: "HR Tech", "Legal Tech", "Fintech for SMBs"
  keywords: string[];         // Targeting terms: ["HRIS", "payroll", "workforce management"]
  priorityRank: number;
  painPoints: string[];
  whatClientOffers: string[];
  howTheyWorkTogether: string;
  estimatedMarketFit: "high" | "medium" | "low";
}

export interface IndustryPriorityOutput {
  industries: IndustryDefinition[];
}

// ─── ICP ─────────────────────────────────────────────────────────────────────
// Runs second — defines ideal customer profiles per priority industry.

export interface Firmographics {
  companySize: string[]; // Apollo ranges: "1,10" | "11,20" | "21,50" | "51,100" | "101,200" | "201,500" | "501,1000" | "1001,2000" | "2001,5000" | "5001,10000" | "10001,"
  revenue: string[];     // e.g. ["$1M-$10M", "$10M-$50M"]
  geographies: string[];
  industries: string[];  // standardIndustry values
  technologies: string[];
  businessModels: string[];
}

export interface BuyerPersona {
  title: string;
  seniorities: string[]; // Apollo: "owner" | "founder" | "c_suite" | "partner" | "vp" | "head" | "director" | "manager" | "senior" | "entry"
  departments: string[];
  goals: string[];
  challenges: string[];
  triggerEvents: string[];
}

export interface ICPDefinition {
  standardIndustry: string;  // Apollo/LinkedIn-compatible: "Computer Software", "Financial Services"
  niche: string;             // Sub-segment: "HR Tech", "Legal Tech", "Fintech for SMBs"
  keywords: string[];        // Targeting terms: ["HRIS", "payroll", "workforce management"]
  firmographics: Firmographics;
  buyerPersonas: BuyerPersona[];
}

export interface ICPOutput {
  icps: ICPDefinition[];
}

// ─── Target Markets ──────────────────────────────────────────────────────────
// Runs third — identifies the best markets by problems, trends, and priority.
// Firmographics and buyer personas are handled in the ICP step.

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
  database: "apollo" | "clay" | "ai-estimated";
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
  competitors: Competitor[];
  isIndustrySpecific: boolean;
  // Array instead of Record to avoid JSON schema propertyNames (unsupported by some models)
  byIndustry?: { industry: string; competitors: Competitor[] }[];
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
  INDUSTRY_PRIORITY: IndustryPriorityOutput;
  ICP: ICPOutput;
  TARGET_MARKETS: TargetMarketsOutput;
  SEGMENTATION: SegmentationOutput;
  MARKET_SIZING: MarketSizingOutput;
  COMPETITIVE: CompetitiveAnalysisOutput;
  POSITIONING: PositioningOutput;
  MANIFESTO: ManifestoOutput;
};

// ─── Step result wrapper ─────────────────────────────────────────────────────

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  model: string;
}

export interface WorkflowStepResult<T> {
  output: T;
  usage: TokenUsage;
}

// ─── Workflow context ─────────────────────────────────────────────────────────

export interface WorkflowContext {
  projectId: string;
  websiteUrl: string;
  companyProfile: CompanyProfile;
  clarifyingAnswers: Record<string, string>;
  businessType: string;
  steps: Partial<StepOutputMap>;
  editPrompt?: string; // For step re-runs with user refinements
}
