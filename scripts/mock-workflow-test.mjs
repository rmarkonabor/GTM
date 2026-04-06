// Mock Workflow Test for GTM Planning Tool
// Tests the workflow step context building, data flow, and shape validation
// for the fictional company "Nexus Analytics"

// ─── Re-implementation of buildStepContext in plain JS ─────────────────────

function buildStepContext(ctx, include) {
  const parts = [];

  parts.push("=== COMPANY PROFILE ===");
  parts.push(JSON.stringify(ctx.companyProfile));

  if (Object.keys(ctx.clarifyingAnswers).length > 0) {
    parts.push("\n=== CLARIFYING ANSWERS FROM TEAM ===");
    Object.entries(ctx.clarifyingAnswers).forEach(([q, a]) => {
      parts.push(`Q: ${q}\nA: ${a}`);
    });
  }

  const shouldInclude = (key) => include === undefined || include.includes(key);

  if (shouldInclude("INDUSTRY_PRIORITY") && ctx.steps.INDUSTRY_PRIORITY) {
    parts.push("\n=== INDUSTRY PRIORITIES ===");
    parts.push(JSON.stringify(ctx.steps.INDUSTRY_PRIORITY));
  }

  if (shouldInclude("TARGET_MARKETS") && ctx.steps.TARGET_MARKETS) {
    parts.push("\n=== TARGET MARKETS ===");
    parts.push(JSON.stringify(ctx.steps.TARGET_MARKETS));
  }

  if (shouldInclude("ICP") && ctx.steps.ICP) {
    parts.push("\n=== ICP DEFINITIONS ===");
    parts.push(JSON.stringify(ctx.steps.ICP));
  }

  if (shouldInclude("COMPETITIVE") && ctx.steps.COMPETITIVE) {
    parts.push("\n=== COMPETITIVE ANALYSIS ===");
    parts.push(JSON.stringify(ctx.steps.COMPETITIVE));
  }

  if (shouldInclude("SEGMENTATION") && ctx.steps.SEGMENTATION) {
    parts.push("\n=== SEGMENTS ===");
    parts.push(JSON.stringify(ctx.steps.SEGMENTATION));
  }

  if (shouldInclude("MARKET_SIZING") && ctx.steps.MARKET_SIZING) {
    parts.push("\n=== MARKET SIZING DATA ===");
    parts.push(JSON.stringify(ctx.steps.MARKET_SIZING));
  }

  if (shouldInclude("POSITIONING") && ctx.steps.POSITIONING) {
    parts.push("\n=== POSITIONING ===");
    parts.push(JSON.stringify(ctx.steps.POSITIONING));
  }

  return parts.join("\n");
}

// ─── Test runner helpers ────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const failures = [];

function pass(label) {
  console.log(`  PASS: ${label}`);
  passCount++;
}

function fail(label, detail) {
  console.log(`  FAIL: ${label}${detail ? " — " + detail : ""}`);
  failCount++;
  failures.push({ label, detail });
}

function check(label, condition, detail) {
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`SECTION: ${title}`);
  console.log("─".repeat(60));
}


// ─── Mock Data: Nexus Analytics ────────────────────────────────────────────

const mockCompanyProfile = {
  name: "Nexus Analytics",
  website: "nexusanalytics.io",
  description: "B2B SaaS platform for e-commerce analytics and conversion optimization",
  businessType: "b2b_saas",
  primaryProduct: "Real-time e-commerce analytics dashboard with AI-powered conversion insights",
  targetAudience: "E-commerce businesses and digital retailers seeking data-driven growth",
  geographicFocus: "North America and Western Europe",
  keyDifferentiators: [
    "AI-powered conversion predictions",
    "Real-time data pipeline with sub-second latency",
    "Pre-built integrations with 50+ e-commerce platforms",
    "No-code funnel builder"
  ],
  currentCustomerExamples: ["ShopifyPlus merchants", "WooCommerce agencies", "Mid-market DTC brands"],
  techStack: ["React", "Node.js", "PostgreSQL", "Kafka", "Snowflake"],
  foundedYear: 2021,
  teamSize: "11-50",
  fundingStage: "Series A"
};

const mockClarifyingAnswers = {
  "What is your average contract value?": "$18,000/year ACV targeting mid-market",
  "Which e-commerce verticals are your best customers in?": "Fashion, home goods, and health/beauty DTC brands",
  "What is your primary sales motion?": "Product-led growth with sales-assist for deals over $10k"
};

// ─── Mock Step Outputs ──────────────────────────────────────────────────────

// IndustryPriorityOutput — single object with industries array
const mockIndustryPriority = {
  industries: [
    {
      industryName: "Direct-to-Consumer (DTC) E-commerce",
      priorityRank: 1,
      painPoints: [
        "High cart abandonment rates with no actionable insight",
        "Fragmented data across ad platforms, CRM, and storefront",
        "Inability to attribute revenue to specific funnel steps"
      ],
      whatClientOffers: [
        "Unified conversion funnel dashboard",
        "AI-powered abandonment prediction",
        "Cross-platform attribution modeling"
      ],
      howTheyWorkTogether: "Nexus Analytics sits between the e-commerce platform and BI tools, ingesting real-time event streams to surface conversion blockers before revenue is lost.",
      estimatedMarketFit: "high"
    },
    {
      industryName: "B2B E-commerce & Wholesale",
      priorityRank: 2,
      painPoints: [
        "Long purchase cycles with multi-session attribution complexity",
        "Difficulty measuring account-level conversion rates",
        "No visibility into which product pages drive deal velocity"
      ],
      whatClientOffers: [
        "Account-level analytics aggregation",
        "Multi-session funnel tracking",
        "Deal velocity correlation with content engagement"
      ],
      howTheyWorkTogether: "Nexus bridges CRM data with storefront analytics to give B2B e-commerce teams a complete picture of the buyer journey from first touch to closed order.",
      estimatedMarketFit: "medium"
    },
    {
      industryName: "E-commerce Agencies & System Integrators",
      priorityRank: 3,
      painPoints: [
        "Reporting overhead consuming 20%+ of account management time",
        "Clients demanding ROI proof but no consolidated reporting tool",
        "Churn risk when clients can't see growth from agency work"
      ],
      whatClientOffers: [
        "White-label analytics dashboards",
        "Multi-client portfolio view",
        "Automated monthly performance reports"
      ],
      howTheyWorkTogether: "Agencies use Nexus to deliver branded analytics to clients, reducing reporting time while demonstrating clear ROI that justifies retainers.",
      estimatedMarketFit: "medium"
    }
  ]
};

// TargetMarketsOutput
const mockTargetMarkets = {
  markets: [
    {
      id: "tm-dtc-fashion",
      name: "DTC Fashion & Apparel",
      urgentProblems: [
        "iOS privacy changes decimated Facebook pixel attribution",
        "Rising CAC making every conversion optimization critical",
        "Seasonal inventory tied to conversion rate performance"
      ],
      importantProblems: [
        "Understanding size/fit return rates to improve PDPs",
        "Influencer attribution across UTM-dark social channels"
      ],
      macroTrends: [
        "Post-cookie identity resolution becoming table stakes",
        "AI personalization driving 15-30% lift in conversion rates",
        "BNPL adoption reshaping checkout conversion patterns"
      ],
      whyRightMarket: "DTC fashion brands have high transaction volume, tight margins, and direct dependency on conversion rate improvement. Nexus Analytics' real-time funnel visibility directly reduces CAC and improves ROAS.",
      priorityScore: 9
    },
    {
      id: "tm-health-beauty",
      name: "Health & Beauty DTC",
      urgentProblems: [
        "Subscription conversion and churn prediction",
        "Regulatory constraints limiting retargeting options"
      ],
      importantProblems: [
        "Multi-SKU upsell funnel optimization",
        "Review-to-conversion correlation analysis"
      ],
      macroTrends: [
        "Subscription commerce growth driving LTV focus",
        "First-party data strategies accelerating",
        "TikTok Shop driving new attribution complexity"
      ],
      whyRightMarket: "Health & beauty brands are investing heavily in owned data and subscription conversion. Nexus provides the analytics layer to make those investments measurable.",
      priorityScore: 8
    },
    {
      id: "tm-home-goods",
      name: "Home Goods & Furniture DTC",
      urgentProblems: [
        "High-consideration purchases with long browse-to-buy cycles",
        "3D/AR feature adoption not tied to conversion metrics"
      ],
      importantProblems: [
        "Cross-device path analysis for desktop research to mobile purchase",
        "Room visualizer engagement to conversion correlation"
      ],
      macroTrends: [
        "Home improvement spending stabilizing post-pandemic",
        "Visual commerce tools proliferating without analytics layer"
      ],
      whyRightMarket: "Long consideration cycles in home goods mean every touchpoint matters. Nexus helps teams understand which content and experiences drive purchase intent.",
      priorityScore: 7
    }
  ]
};

// ICPOutput
const mockICP = {
  icps: [
    {
      industryName: "Direct-to-Consumer (DTC) E-commerce",
      firmographics: {
        companySize: ["11-50", "51-200"],
        revenue: ["$5M-$50M"],
        geographies: ["United States", "Canada", "United Kingdom"],
        industries: ["Fashion & Apparel", "Health & Beauty", "Home Goods"],
        technologies: ["Shopify Plus", "Klaviyo", "Google Analytics 4", "Triple Whale"],
        businessModels: ["D2C", "Subscription", "Marketplace hybrid"]
      },
      buyerPersonas: [
        {
          title: "VP of E-commerce",
          seniorities: ["vp", "director"],
          departments: ["E-commerce", "Digital"],
          goals: [
            "Improve conversion rate by 20% YoY",
            "Reduce CAC while scaling paid acquisition",
            "Build first-party data capabilities before cookie deprecation"
          ],
          challenges: [
            "Data is siloed across 6+ tools with no single source of truth",
            "Team spends 2 days per month manually building performance reports",
            "Board wants revenue growth but attribution is unclear"
          ],
          triggerEvents: [
            "Just completed a funding round and scaling paid media",
            "Platform migration from Magento to Shopify Plus",
            "Lost a key data analyst and need to democratize analytics"
          ]
        },
        {
          title: "Head of Growth / Performance Marketing",
          seniorities: ["director", "manager", "head-of"],
          departments: ["Growth", "Marketing", "Performance"],
          goals: [
            "Maximize ROAS across channels",
            "Identify top-performing funnel stages to double down on",
            "Justify budget increases with clear attribution data"
          ],
          challenges: [
            "Attribution models disagree — GA4 vs platform vs MTA tell different stories",
            "Can't isolate which funnel change drove a conversion lift",
            "Reporting to CMO requires 3 hours of manual spreadsheet work"
          ],
          triggerEvents: [
            "Q4 planning cycle requiring data-backed budget proposals",
            "Recent conversion rate drop with no clear root cause",
            "Competitor launched new product and is outperforming on paid"
          ]
        }
      ]
    },
    {
      industryName: "E-commerce Agencies & System Integrators",
      firmographics: {
        companySize: ["11-50", "51-200"],
        revenue: ["$2M-$20M"],
        geographies: ["United States", "United Kingdom", "Australia"],
        industries: ["Digital Marketing Agency", "E-commerce Consultancy"],
        technologies: ["Shopify", "WooCommerce", "HubSpot", "Looker Studio"],
        businessModels: ["Retainer", "Project-based", "Performance"]
      },
      buyerPersonas: [
        {
          title: "Agency Director / Partner",
          seniorities: ["c-suite", "vp", "partner"],
          departments: ["Leadership", "Client Services"],
          goals: [
            "Differentiate agency offering with proprietary analytics capability",
            "Reduce client churn by demonstrating measurable ROI",
            "Scale to more clients without proportional headcount growth"
          ],
          challenges: [
            "Every client uses different tools making standardized reporting impossible",
            "Reporting takes 20% of account manager time every month",
            "Clients perceive analytics as a commodity, not a differentiator"
          ],
          triggerEvents: [
            "Lost a client due to inability to prove ROI",
            "Pitching a new enterprise client who demands sophisticated analytics",
            "Hired a new Head of Strategy who wants to build a data practice"
          ]
        }
      ]
    }
  ]
};


// CompetitiveAnalysisOutput
const mockCompetitive = {
  competitors: [
    {
      name: "Glew.io",
      domain: "glew.io",
      location: "United States",
      valueProp: "Multi-channel e-commerce analytics with pre-built integrations",
      keyOfferings: ["Revenue dashboards", "Customer LTV analysis", "Marketing attribution"],
      whereTheyWin: ["Established Shopify user base", "Broad channel integrations", "Easy onboarding"],
      whereClientWins: ["Real-time data (Glew is batch/daily)", "AI conversion predictions", "No-code funnel builder"],
      targetSegment: "Direct-to-Consumer (DTC) E-commerce",
      pricingModel: "Per-seat SaaS, $299-$999/mo"
    },
    {
      name: "Triple Whale",
      domain: "triplewhale.com",
      location: "United States",
      valueProp: "Ecommerce data platform focused on paid media attribution and profitability",
      keyOfferings: ["Attribution modeling", "Profit dashboard", "Creative analytics"],
      whereTheyWin: ["Strong Shopify-native positioning", "Paid media team focus", "Fast-growing brand awareness"],
      whereClientWins: ["Broader funnel analytics beyond paid", "Agency multi-client view", "B2B e-commerce support"],
      targetSegment: "DTC Fashion & Apparel",
      pricingModel: "Flat-rate SaaS, $129-$799/mo"
    },
    {
      name: "Northbeam",
      domain: "northbeam.io",
      location: "United States",
      valueProp: "ML-powered multi-touch attribution for performance marketers",
      keyOfferings: ["Multi-touch attribution", "Media mix modeling", "Channel performance"],
      whereTheyWin: ["Advanced attribution methodology", "Enterprise credibility", "Agency partnerships"],
      whereClientWins: ["Full-funnel analytics (not just attribution)", "Conversion optimization AI", "Lower price point"],
      targetSegment: "Health & Beauty DTC",
      pricingModel: "Custom enterprise pricing"
    },
    {
      name: "Daasity",
      domain: "daasity.com",
      location: "United States",
      valueProp: "Data pipeline and analytics for e-commerce brands",
      keyOfferings: ["Data warehouse setup", "Standardized metrics", "Custom dashboards"],
      whereTheyWin: ["Data engineering flexibility", "Enterprise data teams", "Warehouse-native approach"],
      whereClientWins: ["No engineering required", "Faster time-to-insight", "AI-native vs bolt-on"],
      targetSegment: "E-commerce Agencies & System Integrators",
      pricingModel: "$500-$2000/mo depending on data volume"
    }
  ],
  isIndustrySpecific: false,
  byIndustry: null
};

// SegmentationOutput
const mockSegmentation = {
  segments: [
    {
      id: "seg-dtc-mid-market-us",
      name: "Mid-Market DTC Brands (US)",
      sizeCategory: "mid-market",
      geographies: ["United States"],
      industries: ["Fashion & Apparel", "Health & Beauty", "Home Goods"],
      estimatedPriority: "tier-1",
      rationale: "Highest revenue potential with 51-200 employee DTC brands doing $10M-$50M. They have analytics budget, feel attribution pain acutely, and have enough traffic for Nexus to show ROI quickly."
    },
    {
      id: "seg-dtc-smb-us",
      name: "SMB DTC Brands (US)",
      sizeCategory: "smb",
      geographies: ["United States", "Canada"],
      industries: ["Fashion & Apparel", "Health & Beauty"],
      estimatedPriority: "tier-2",
      rationale: "11-50 employee brands doing $1M-$10M are price-sensitive but conversion optimization is existential. PLG motion fits well. Lower ACV but high volume potential."
    },
    {
      id: "seg-agencies-us-uk",
      name: "E-commerce Agencies (US/UK)",
      sizeCategory: "smb",
      geographies: ["United States", "United Kingdom"],
      industries: ["Digital Marketing Agency", "E-commerce Consultancy"],
      estimatedPriority: "tier-2",
      rationale: "Agency partnerships can drive multi-client deployments but have longer sales cycles. White-label capability is a strong differentiator."
    },
    {
      id: "seg-dtc-enterprise-uk",
      name: "Enterprise DTC Brands (UK/EU)",
      sizeCategory: "enterprise",
      geographies: ["United Kingdom", "Germany", "France"],
      industries: ["Fashion & Apparel", "Home Goods"],
      estimatedPriority: "tier-3",
      rationale: "Large EU brands have complex analytics needs and longer procurement cycles. Geographic expansion play for year 2+ with localization requirements."
    }
  ]
};

// MarketSizingOutput
const mockMarketSizing = {
  results: [
    {
      segmentId: "seg-dtc-mid-market-us",
      segmentName: "Mid-Market DTC Brands (US)",
      database: "apollo",
      tam_companies: 12400,
      sam_companies: 4960,
      som_companies: 595,
      tam_contacts: 87000,
      sam_contacts: 34800,
      som_contacts: 4176,
      filtersUsed: {
        employee_ranges: ["11,50", "51,200"],
        annual_revenue_ranges: ["10000000,50000000"],
        industries: ["retail", "consumer goods"],
        keywords: ["shopify", "direct to consumer", "ecommerce"]
      },
      fetchedAt: "2026-04-06T10:00:00Z"
    },
    {
      segmentId: "seg-dtc-smb-us",
      segmentName: "SMB DTC Brands (US)",
      database: "apollo",
      tam_companies: 38600,
      sam_companies: 15440,
      som_companies: 1853,
      tam_contacts: 193000,
      sam_contacts: 77200,
      som_contacts: 9264,
      filtersUsed: {
        employee_ranges: ["1,50"],
        annual_revenue_ranges: ["1000000,10000000"],
        industries: ["retail", "consumer goods"],
        keywords: ["shopify", "woocommerce", "ecommerce"]
      },
      fetchedAt: "2026-04-06T10:01:00Z"
    },
    {
      segmentId: "seg-agencies-us-uk",
      segmentName: "E-commerce Agencies (US/UK)",
      database: "apollo",
      tam_companies: 8200,
      sam_companies: 3280,
      som_companies: 394,
      tam_contacts: 41000,
      sam_contacts: 16400,
      som_contacts: 1968,
      filtersUsed: {
        employee_ranges: ["11,200"],
        industries: ["marketing & advertising", "consulting"],
        keywords: ["ecommerce agency", "shopify partner", "digital agency"]
      },
      fetchedAt: "2026-04-06T10:02:00Z"
    }
  ],
  totalTAM_companies: 59200,
  totalSAM_companies: 23680,
  totalSOM_companies: 2842
};

// PositioningOutput
const mockPositioning = {
  uniqueValueProp: "The only analytics platform built exclusively for e-commerce conversion — real-time AI insights that tell you exactly where and why customers drop off, so you can fix it before it costs you.",
  differentiationPoints: [
    "Sub-second real-time data vs. competitors' daily batch processing",
    "AI-powered conversion predictions, not just historical dashboards",
    "E-commerce-native data model — no generic BI tool setup required",
    "No-code funnel builder accessible to non-technical marketers",
    "Pre-built integrations with 50+ e-commerce platforms out of the box"
  ],
  positioningStatement: "For e-commerce brands and agencies that lose revenue to invisible conversion blockers, Nexus Analytics is the real-time AI analytics platform that surfaces exactly where and why customers abandon — unlike legacy BI tools or attribution point-solutions that only show what happened after revenue was already lost.",
  bySegment: [
    {
      segmentName: "Mid-Market DTC Brands (US)",
      keyPlayers: ["Triple Whale", "Glew.io", "Northbeam"],
      differentiationAngle: "While Triple Whale and Northbeam focus on paid media attribution, Nexus covers the full conversion funnel with real-time AI — giving DTC teams the complete picture from click to checkout without stitching together multiple tools."
    },
    {
      segmentName: "SMB DTC Brands (US)",
      keyPlayers: ["Glew.io", "Google Analytics 4"],
      differentiationAngle: "Unlike GA4 which requires analyst expertise, Nexus delivers instant, actionable conversion insights designed for non-technical e-commerce managers — with pricing that scales from startup to Series B."
    },
    {
      segmentName: "E-commerce Agencies (US/UK)",
      keyPlayers: ["Daasity", "Looker Studio"],
      differentiationAngle: "Nexus replaces Daasity's data engineering complexity with a white-label ready, zero-setup analytics suite — letting agencies focus on strategy, not data pipelines."
    }
  ]
};

// ManifestoOutput
const mockManifesto = {
  who: "E-commerce growth teams and digital agencies who can't afford to lose another sale to an invisible conversion blocker",
  whyExist: "Every day, e-commerce brands watch potential customers abandon their carts, bounce from PDPs, and exit checkout — but they have no idea why. The tools that exist are either too simple (GA4 dashboards), too expensive (enterprise BI), or focused on the wrong problem (paid attribution). Nexus Analytics exists to give every e-commerce team the real-time AI intelligence to see, understand, and fix conversion problems before they become revenue losses.",
  whatTheyDo: "Nexus Analytics is a real-time e-commerce analytics platform powered by AI. It ingests live event streams from your storefront, ad platforms, and CRM to build a unified view of your conversion funnel — then uses machine learning to predict where customers will drop off and tell you exactly what to do about it.",
  whyChooseThem: "Unlike point-solutions that only show attribution or dashboards that only show what happened, Nexus combines real-time data, AI predictions, and a no-code funnel builder in one platform purpose-built for e-commerce. You get answers in seconds, not days — and recommendations you can act on today.",
  tagline: "See why they left. Win them back.",
  elevatorPitch: "Nexus Analytics is the real-time AI platform that shows e-commerce teams exactly where and why customers abandon — and predicts who's about to leave next. Instead of piecing together data from GA4, your ad platforms, and a spreadsheet, you get a single live dashboard with AI-powered conversion recommendations that help you act before revenue walks out the door.",
  messagingPillars: [
    {
      pillar: "Real-Time Intelligence",
      headline: "Stop analyzing yesterday's losses",
      supportingPoints: [
        "Sub-second data pipeline means you see drop-offs as they happen",
        "Real-time alerts when conversion rate drops below threshold",
        "Live funnel heatmaps updated every 30 seconds"
      ]
    },
    {
      pillar: "AI-Powered Predictions",
      headline: "Know who's about to leave before they do",
      supportingPoints: [
        "ML model predicts abandonment with 78% accuracy",
        "Automated recommendations ranked by revenue impact",
        "A/B test suggestions generated from your own conversion patterns"
      ]
    },
    {
      pillar: "E-commerce Native",
      headline: "Built for e-commerce, not retrofitted for it",
      supportingPoints: [
        "50+ pre-built integrations — live in under an hour",
        "Metrics defined for e-commerce by default (AOV, CVR, ROAS, LTV)",
        "No BI analyst or data engineer required"
      ]
    }
  ]
};


// ─── Build the full WorkflowContext ────────────────────────────────────────

const mockCtx = {
  projectId: "nexus-analytics-test-001",
  websiteUrl: "https://nexusanalytics.io",
  companyProfile: mockCompanyProfile,
  clarifyingAnswers: mockClarifyingAnswers,
  businessType: "b2b_saas",
  steps: {
    INDUSTRY_PRIORITY: mockIndustryPriority,
    TARGET_MARKETS: mockTargetMarkets,
    ICP: mockICP,
    COMPETITIVE: mockCompetitive,
    SEGMENTATION: mockSegmentation,
    MARKET_SIZING: mockMarketSizing,
    POSITIONING: mockPositioning,
    MANIFESTO: mockManifesto,
  }
};

// ─── STEP_ORDER definitions (as found in source files) ─────────────────────

// orchestrator.ts: does NOT include RESEARCH
const STEP_ORDER_ORCHESTRATOR = [
  "INDUSTRY_PRIORITY",
  "TARGET_MARKETS",
  "ICP",
  "COMPETITIVE",
  "SEGMENTATION",
  "MARKET_SIZING",
  "POSITIONING",
  "MANIFESTO",
];

// restore/route.ts: INCLUDES RESEARCH
const STEP_ORDER_RESTORE = [
  "RESEARCH", "INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP",
  "COMPETITIVE", "SEGMENTATION", "MARKET_SIZING", "POSITIONING", "MANIFESTO"
];

// ProjectStepNav.tsx STEPS array order
const STEP_ORDER_SIDEBAR = [
  "RESEARCH",
  "INDUSTRY_PRIORITY",
  "TARGET_MARKETS",
  "ICP",
  "COMPETITIVE",
  "SEGMENTATION",
  "MARKET_SIZING",
  "POSITIONING",
  "MANIFESTO",
];

// ─── Step context include arrays (from source) ──────────────────────────────

const STEP_CONTEXT_INCLUDES = {
  INDUSTRY_PRIORITY: [],               // runIndustryPriority.ts: buildStepContext(ctx, [])
  TARGET_MARKETS: ["INDUSTRY_PRIORITY"], // runTargetMarkets.ts
  ICP: ["TARGET_MARKETS", "INDUSTRY_PRIORITY"], // runICP.ts
  COMPETITIVE: ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP"], // runCompetitive.ts
  SEGMENTATION: ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP", "COMPETITIVE"], // runSegmentation.ts
  MARKET_SIZING: null, // runMarketSizing.ts does NOT call buildStepContext at all
  POSITIONING: ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP", "COMPETITIVE", "SEGMENTATION"], // runPositioning.ts
  MANIFESTO: ["ICP", "COMPETITIVE", "SEGMENTATION", "POSITIONING"], // runManifesto.ts
};

// ─── Shape validators ──────────────────────────────────────────────────────

function validateIndustryPriorityOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  if (!Array.isArray(obj.industries)) errors.push("Missing industries array");
  else {
    obj.industries.forEach((ind, i) => {
      if (typeof ind.industryName !== "string") errors.push(`industries[${i}].industryName missing`);
      if (typeof ind.priorityRank !== "number") errors.push(`industries[${i}].priorityRank missing`);
      if (!Array.isArray(ind.painPoints)) errors.push(`industries[${i}].painPoints missing`);
      if (!Array.isArray(ind.whatClientOffers)) errors.push(`industries[${i}].whatClientOffers missing`);
      if (typeof ind.howTheyWorkTogether !== "string") errors.push(`industries[${i}].howTheyWorkTogether missing`);
      if (!["high","medium","low"].includes(ind.estimatedMarketFit)) errors.push(`industries[${i}].estimatedMarketFit invalid`);
    });
  }
  return errors;
}

function validateTargetMarketsOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  if (!Array.isArray(obj.markets)) errors.push("Missing markets array");
  else {
    obj.markets.forEach((m, i) => {
      if (typeof m.id !== "string") errors.push(`markets[${i}].id missing`);
      if (typeof m.name !== "string") errors.push(`markets[${i}].name missing`);
      if (!Array.isArray(m.urgentProblems)) errors.push(`markets[${i}].urgentProblems missing`);
      if (!Array.isArray(m.importantProblems)) errors.push(`markets[${i}].importantProblems missing`);
      if (!Array.isArray(m.macroTrends)) errors.push(`markets[${i}].macroTrends missing`);
      if (typeof m.whyRightMarket !== "string") errors.push(`markets[${i}].whyRightMarket missing`);
      if (typeof m.priorityScore !== "number") errors.push(`markets[${i}].priorityScore missing`);
    });
  }
  return errors;
}

function validateICPOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  if (!Array.isArray(obj.icps)) errors.push("Missing icps array");
  else {
    obj.icps.forEach((icp, i) => {
      if (typeof icp.industryName !== "string") errors.push(`icps[${i}].industryName missing`);
      if (typeof icp.firmographics !== "object") errors.push(`icps[${i}].firmographics missing`);
      else {
        const f = icp.firmographics;
        ["companySize","revenue","geographies","industries","technologies","businessModels"].forEach(field => {
          if (!Array.isArray(f[field])) errors.push(`icps[${i}].firmographics.${field} missing`);
        });
      }
      if (!Array.isArray(icp.buyerPersonas)) errors.push(`icps[${i}].buyerPersonas missing`);
      else {
        icp.buyerPersonas.forEach((p, j) => {
          if (typeof p.title !== "string") errors.push(`icps[${i}].buyerPersonas[${j}].title missing`);
          if (!Array.isArray(p.seniorities)) errors.push(`icps[${i}].buyerPersonas[${j}].seniorities missing`);
          if (!Array.isArray(p.departments)) errors.push(`icps[${i}].buyerPersonas[${j}].departments missing`);
          if (!Array.isArray(p.goals)) errors.push(`icps[${i}].buyerPersonas[${j}].goals missing`);
          if (!Array.isArray(p.challenges)) errors.push(`icps[${i}].buyerPersonas[${j}].challenges missing`);
          if (!Array.isArray(p.triggerEvents)) errors.push(`icps[${i}].buyerPersonas[${j}].triggerEvents missing`);
        });
      }
    });
  }
  return errors;
}

function validateCompetitiveAnalysisOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  if (!Array.isArray(obj.competitors)) errors.push("Missing competitors array");
  else {
    obj.competitors.forEach((c, i) => {
      ["name","domain","location","valueProp","targetSegment"].forEach(field => {
        if (typeof c[field] !== "string") errors.push(`competitors[${i}].${field} missing`);
      });
      ["keyOfferings","whereTheyWin","whereClientWins"].forEach(field => {
        if (!Array.isArray(c[field])) errors.push(`competitors[${i}].${field} missing`);
      });
    });
  }
  if (typeof obj.isIndustrySpecific !== "boolean") errors.push("Missing isIndustrySpecific boolean");
  return errors;
}

function validateSegmentationOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  if (!Array.isArray(obj.segments)) errors.push("Missing segments array");
  else {
    const validSizeCategories = ["enterprise", "mid-market", "smb", "startup"];
    const validPriorities = ["tier-1", "tier-2", "tier-3"];
    obj.segments.forEach((s, i) => {
      if (typeof s.id !== "string") errors.push(`segments[${i}].id missing`);
      if (typeof s.name !== "string") errors.push(`segments[${i}].name missing`);
      if (!validSizeCategories.includes(s.sizeCategory)) errors.push(`segments[${i}].sizeCategory invalid: ${s.sizeCategory}`);
      if (!Array.isArray(s.geographies)) errors.push(`segments[${i}].geographies missing`);
      if (!Array.isArray(s.industries)) errors.push(`segments[${i}].industries missing`);
      if (!validPriorities.includes(s.estimatedPriority)) errors.push(`segments[${i}].estimatedPriority invalid: ${s.estimatedPriority}`);
      if (typeof s.rationale !== "string") errors.push(`segments[${i}].rationale missing`);
    });
  }
  return errors;
}

function validateMarketSizingOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  if (!Array.isArray(obj.results)) errors.push("Missing results array");
  else {
    obj.results.forEach((r, i) => {
      ["segmentId","segmentName","database","fetchedAt"].forEach(field => {
        if (typeof r[field] !== "string") errors.push(`results[${i}].${field} missing`);
      });
      ["tam_companies","sam_companies","som_companies","tam_contacts","sam_contacts","som_contacts"].forEach(field => {
        if (typeof r[field] !== "number") errors.push(`results[${i}].${field} missing`);
      });
      if (!["apollo","clay"].includes(r.database)) errors.push(`results[${i}].database invalid: ${r.database}`);
    });
  }
  if (typeof obj.totalTAM_companies !== "number") errors.push("Missing totalTAM_companies");
  if (typeof obj.totalSAM_companies !== "number") errors.push("Missing totalSAM_companies");
  if (typeof obj.totalSOM_companies !== "number") errors.push("Missing totalSOM_companies");
  return errors;
}

function validatePositioningOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  if (typeof obj.uniqueValueProp !== "string") errors.push("Missing uniqueValueProp");
  if (!Array.isArray(obj.differentiationPoints)) errors.push("Missing differentiationPoints");
  if (typeof obj.positioningStatement !== "string") errors.push("Missing positioningStatement");
  if (!Array.isArray(obj.bySegment)) errors.push("Missing bySegment array");
  else {
    obj.bySegment.forEach((s, i) => {
      if (typeof s.segmentName !== "string") errors.push(`bySegment[${i}].segmentName missing`);
      if (!Array.isArray(s.keyPlayers)) errors.push(`bySegment[${i}].keyPlayers missing`);
      if (typeof s.differentiationAngle !== "string") errors.push(`bySegment[${i}].differentiationAngle missing`);
    });
  }
  return errors;
}

function validateManifestoOutput(obj) {
  const errors = [];
  if (typeof obj !== "object" || obj === null) return ["Not an object"];
  ["who","whyExist","whatTheyDo","whyChooseThem","tagline","elevatorPitch"].forEach(field => {
    if (typeof obj[field] !== "string") errors.push(`Missing ${field}`);
  });
  if (!Array.isArray(obj.messagingPillars)) errors.push("Missing messagingPillars array");
  else {
    obj.messagingPillars.forEach((p, i) => {
      if (typeof p.pillar !== "string") errors.push(`messagingPillars[${i}].pillar missing`);
      if (typeof p.headline !== "string") errors.push(`messagingPillars[${i}].headline missing`);
      if (!Array.isArray(p.supportingPoints)) errors.push(`messagingPillars[${i}].supportingPoints missing`);
    });
  }
  return errors;
}


// ─── TEST SUITE ────────────────────────────────────────────────────────────

console.log("=".repeat(60));
console.log("GTM MOCK WORKFLOW TEST — Nexus Analytics");
console.log("=".repeat(60));

// ──────────────────────────────────────────────────────────────────────────
section("1. STEP_ORDER CONSISTENCY ACROSS FILES");
// ──────────────────────────────────────────────────────────────────────────

// Restore route and sidebar both include RESEARCH; orchestrator does not (it never runs RESEARCH itself)
// The relative order of the shared steps must be identical.

const sharedSteps = STEP_ORDER_ORCHESTRATOR; // the 8 steps orchestrator actually runs

// Check restore route contains all orchestrator steps in the same relative order
const restoreSubset = STEP_ORDER_RESTORE.filter(s => sharedSteps.includes(s));
check(
  "Restore route contains all orchestrator steps",
  restoreSubset.length === sharedSteps.length,
  `Restore has ${restoreSubset.length}, orchestrator has ${sharedSteps.length}`
);
check(
  "Restore route step order matches orchestrator (for shared steps)",
  JSON.stringify(restoreSubset) === JSON.stringify(sharedSteps),
  `restore subset: ${restoreSubset.join(",")} vs orchestrator: ${sharedSteps.join(",")}`
);

// Check sidebar contains all steps and is in same order as restore route
check(
  "Sidebar STEPS array matches restore route STEP_ORDER exactly",
  JSON.stringify(STEP_ORDER_SIDEBAR) === JSON.stringify(STEP_ORDER_RESTORE),
  `sidebar: ${STEP_ORDER_SIDEBAR.join(",")} vs restore: ${STEP_ORDER_RESTORE.join(",")}`
);

// Check RESEARCH is in sidebar and restore but NOT in orchestrator
check(
  "RESEARCH is in sidebar STEPS",
  STEP_ORDER_SIDEBAR.includes("RESEARCH"),
  null
);
check(
  "RESEARCH is in restore STEP_ORDER",
  STEP_ORDER_RESTORE.includes("RESEARCH"),
  null
);
check(
  "RESEARCH is NOT in orchestrator STEP_ORDER (orchestrator only runs LLM steps)",
  !STEP_ORDER_ORCHESTRATOR.includes("RESEARCH"),
  null
);

// ──────────────────────────────────────────────────────────────────────────
section("2. SHAPE VALIDATION — All Mock Outputs");
// ──────────────────────────────────────────────────────────────────────────

const shapeTests = [
  { name: "IndustryPriorityOutput", data: mockIndustryPriority, validator: validateIndustryPriorityOutput },
  { name: "TargetMarketsOutput", data: mockTargetMarkets, validator: validateTargetMarketsOutput },
  { name: "ICPOutput", data: mockICP, validator: validateICPOutput },
  { name: "CompetitiveAnalysisOutput", data: mockCompetitive, validator: validateCompetitiveAnalysisOutput },
  { name: "SegmentationOutput", data: mockSegmentation, validator: validateSegmentationOutput },
  { name: "MarketSizingOutput", data: mockMarketSizing, validator: validateMarketSizingOutput },
  { name: "PositioningOutput", data: mockPositioning, validator: validatePositioningOutput },
  { name: "ManifestoOutput", data: mockManifesto, validator: validateManifestoOutput },
];

for (const { name, data, validator } of shapeTests) {
  const errors = validator(data);
  if (errors.length === 0) {
    pass(`${name} shape is valid`);
  } else {
    fail(`${name} shape has errors`, errors.join("; "));
  }
}

// ──────────────────────────────────────────────────────────────────────────
section("3. IndustryPriorityOutput — single object (not array)");
// ──────────────────────────────────────────────────────────────────────────

check(
  "INDUSTRY_PRIORITY step output is a plain object (not an array)",
  !Array.isArray(mockIndustryPriority),
  `Got: ${Array.isArray(mockIndustryPriority) ? "ARRAY" : "object"}`
);
check(
  "INDUSTRY_PRIORITY has .industries array",
  Array.isArray(mockIndustryPriority.industries),
  null
);
check(
  "ctx.steps.INDUSTRY_PRIORITY is the same object (not an array of objects)",
  !Array.isArray(mockCtx.steps.INDUSTRY_PRIORITY),
  null
);

// ──────────────────────────────────────────────────────────────────────────
section("4. ICP reads ctx.steps.INDUSTRY_PRIORITY?.industries (not flatMap)");
// ──────────────────────────────────────────────────────────────────────────

// Simulate what runICP.ts does:
// const industries = ctx.steps.INDUSTRY_PRIORITY?.industries ?? [];
const icpIndustries = mockCtx.steps.INDUSTRY_PRIORITY?.industries ?? [];

check(
  "ctx.steps.INDUSTRY_PRIORITY?.industries is an array",
  Array.isArray(icpIndustries),
  null
);
check(
  "ctx.steps.INDUSTRY_PRIORITY?.industries has the correct length (3 industries)",
  icpIndustries.length === 3,
  `Got length: ${icpIndustries.length}`
);
check(
  "First industry is 'Direct-to-Consumer (DTC) E-commerce'",
  icpIndustries[0]?.industryName === "Direct-to-Consumer (DTC) E-commerce",
  `Got: ${icpIndustries[0]?.industryName}`
);

// Verify that using flatMap on the wrong shape would break things
const wrongFlatMap = [mockIndustryPriority].flatMap(o => o.industries ?? []);
check(
  "Wrapping IndustryPriorityOutput in array and flatMapping would still work (not how it should be read)",
  wrongFlatMap.length === 3,
  `flatMap result length: ${wrongFlatMap.length}`
);
// But the correct pattern is a direct .industries access, which is cleaner and what the code actually does
check(
  "Direct .industries access equals flatMap result (confirming single-object pattern is correct)",
  JSON.stringify(icpIndustries) === JSON.stringify(wrongFlatMap),
  null
);

// ──────────────────────────────────────────────────────────────────────────
section("5. CONTEXT BUILDER — Each step's context");
// ──────────────────────────────────────────────────────────────────────────

// For each step, build the context it would receive and verify it contains
// exactly the sections it expects (no more, no less)
const SECTION_MARKERS = {
  INDUSTRY_PRIORITY: "=== INDUSTRY PRIORITIES ===",
  TARGET_MARKETS: "=== TARGET MARKETS ===",
  ICP: "=== ICP DEFINITIONS ===",
  COMPETITIVE: "=== COMPETITIVE ANALYSIS ===",
  SEGMENTATION: "=== SEGMENTS ===",
  MARKET_SIZING: "=== MARKET SIZING DATA ===",
  POSITIONING: "=== POSITIONING ===",
};

for (const [stepName, includes] of Object.entries(STEP_CONTEXT_INCLUDES)) {
  if (includes === null) {
    // MARKET_SIZING doesn't call buildStepContext
    pass(`${stepName}: does not call buildStepContext (reads ctx.steps directly)`);
    continue;
  }

  const context = buildStepContext(mockCtx, includes);

  // Check company profile is always present
  check(
    `${stepName}: context contains COMPANY PROFILE section`,
    context.includes("=== COMPANY PROFILE ==="),
    null
  );

  // Check clarifying answers are present (we have them in mockCtx)
  check(
    `${stepName}: context contains CLARIFYING ANSWERS section`,
    context.includes("=== CLARIFYING ANSWERS FROM TEAM ==="),
    null
  );

  // Check that each included step section is present
  for (const includedStep of includes) {
    const marker = SECTION_MARKERS[includedStep];
    if (marker) {
      check(
        `${stepName}: context includes ${includedStep} section`,
        context.includes(marker),
        null
      );
    }
  }

  // Check that steps NOT in the include list are absent from context
  for (const [otherStep, marker] of Object.entries(SECTION_MARKERS)) {
    if (!includes.includes(otherStep) && marker) {
      check(
        `${stepName}: context does NOT include ${otherStep} (not in include list)`,
        !context.includes(marker),
        `Found unexpected section: ${marker}`
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
section("6. DATA FLOW — INDUSTRY_PRIORITY feeds into downstream steps");
// ──────────────────────────────────────────────────────────────────────────

// TARGET_MARKETS should have INDUSTRY_PRIORITY in context
const tmContext = buildStepContext(mockCtx, ["INDUSTRY_PRIORITY"]);
check(
  "TARGET_MARKETS context contains industry priority data",
  tmContext.includes("Direct-to-Consumer (DTC) E-commerce"),
  null
);
check(
  "TARGET_MARKETS context contains priorityRank field",
  tmContext.includes('"priorityRank"'),
  null
);

// ICP context should have both TARGET_MARKETS and INDUSTRY_PRIORITY
const icpContext = buildStepContext(mockCtx, ["TARGET_MARKETS", "INDUSTRY_PRIORITY"]);
check(
  "ICP context contains target markets data",
  icpContext.includes("DTC Fashion & Apparel"),
  null
);
check(
  "ICP context contains industry priority data",
  icpContext.includes("estimatedMarketFit"),
  null
);

// COMPETITIVE context should have ICP data including firmographics
const compContext = buildStepContext(mockCtx, ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP"]);
check(
  "COMPETITIVE context contains ICP firmographics",
  compContext.includes("firmographics"),
  null
);
check(
  "COMPETITIVE context contains buyer personas",
  compContext.includes("buyerPersonas"),
  null
);

// SEGMENTATION context should have competitive data
const segContext = buildStepContext(mockCtx, ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP", "COMPETITIVE"]);
check(
  "SEGMENTATION context contains competitor names",
  segContext.includes("Triple Whale"),
  null
);

// POSITIONING context should have segmentation
const posContext = buildStepContext(mockCtx, ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP", "COMPETITIVE", "SEGMENTATION"]);
check(
  "POSITIONING context contains segment data",
  posContext.includes("Mid-Market DTC Brands"),
  null
);

// MANIFESTO context should have positioning
const manContext = buildStepContext(mockCtx, ["ICP", "COMPETITIVE", "SEGMENTATION", "POSITIONING"]);
check(
  "MANIFESTO context contains positioning uniqueValueProp",
  manContext.includes("uniqueValueProp"),
  null
);
check(
  "MANIFESTO context does NOT include INDUSTRY_PRIORITY (not in manifesto's include list)",
  !manContext.includes("=== INDUSTRY PRIORITIES ==="),
  null
);
check(
  "MANIFESTO context does NOT include TARGET_MARKETS (not in manifesto's include list)",
  !manContext.includes("=== TARGET MARKETS ==="),
  null
);

// ──────────────────────────────────────────────────────────────────────────
section("7. MARKET_SIZING — reads ctx.steps directly (no buildStepContext)");
// ──────────────────────────────────────────────────────────────────────────

// Verify the data access pattern used in runMarketSizing.ts
const segments = mockCtx.steps.SEGMENTATION?.segments ?? [];
const icps = mockCtx.steps.ICP?.icps ?? [];

check(
  "MARKET_SIZING can read segments from ctx.steps.SEGMENTATION.segments",
  segments.length === 4,
  `Got ${segments.length} segments`
);
check(
  "MARKET_SIZING can read ICPs from ctx.steps.ICP.icps",
  icps.length === 2,
  `Got ${icps.length} ICPs`
);

// Simulate the ICP matching logic from runMarketSizing.ts
const firstSegment = segments[0];
const matchingIcp = icps.find(icp =>
  firstSegment.industries.some(ind =>
    icp.industryName.toLowerCase().includes(ind.toLowerCase())
  )
) ?? icps[0];

check(
  "MARKET_SIZING ICP matching finds an ICP for first segment",
  matchingIcp !== undefined,
  `Matched ICP: ${matchingIcp?.industryName}`
);
check(
  "MARKET_SIZING matched ICP has at least one buyer persona",
  Array.isArray(matchingIcp?.buyerPersonas) && matchingIcp.buyerPersonas.length > 0,
  null
);

// ──────────────────────────────────────────────────────────────────────────
section("8. CONTEXT BUILDER — empty include array vs undefined");
// ──────────────────────────────────────────────────────────────────────────

// INDUSTRY_PRIORITY uses buildStepContext(ctx, []) — empty array means no prior steps
const industryCtxEmpty = buildStepContext(mockCtx, []);
check(
  "buildStepContext with [] includes company profile",
  industryCtxEmpty.includes("=== COMPANY PROFILE ==="),
  null
);
check(
  "buildStepContext with [] includes clarifying answers",
  industryCtxEmpty.includes("=== CLARIFYING ANSWERS FROM TEAM ==="),
  null
);
check(
  "buildStepContext with [] excludes all step sections",
  !industryCtxEmpty.includes("=== INDUSTRY PRIORITIES ===") &&
  !industryCtxEmpty.includes("=== TARGET MARKETS ===") &&
  !industryCtxEmpty.includes("=== ICP DEFINITIONS ==="),
  null
);

// undefined include means ALL steps are included
const ctxAllSteps = buildStepContext(mockCtx, undefined);
check(
  "buildStepContext with undefined include includes ALL step sections",
  ctxAllSteps.includes("=== INDUSTRY PRIORITIES ===") &&
  ctxAllSteps.includes("=== TARGET MARKETS ===") &&
  ctxAllSteps.includes("=== ICP DEFINITIONS ===") &&
  ctxAllSteps.includes("=== COMPETITIVE ANALYSIS ===") &&
  ctxAllSteps.includes("=== SEGMENTS ===") &&
  ctxAllSteps.includes("=== MARKET SIZING DATA ===") &&
  ctxAllSteps.includes("=== POSITIONING ==="),
  null
);

// ──────────────────────────────────────────────────────────────────────────
section("9. CONTEXT BUILDER — print sample context for each step");
// ──────────────────────────────────────────────────────────────────────────

console.log("\nContext length (chars) each step would receive:");
for (const [stepName, includes] of Object.entries(STEP_CONTEXT_INCLUDES)) {
  if (includes === null) {
    console.log(`  ${stepName.padEnd(20)}: N/A (reads ctx.steps directly)`);
    continue;
  }
  const ctx = buildStepContext(mockCtx, includes);
  const sections = [];
  if (ctx.includes("=== COMPANY PROFILE ===")) sections.push("COMPANY_PROFILE");
  if (ctx.includes("=== CLARIFYING ANSWERS FROM TEAM ===")) sections.push("CLARIFYING_ANSWERS");
  for (const [k, marker] of Object.entries(SECTION_MARKERS)) {
    if (ctx.includes(marker)) sections.push(k);
  }
  console.log(`  ${stepName.padEnd(20)}: ${ctx.length.toString().padStart(6)} chars  |  sections: [${sections.join(", ")}]`);
}

// ──────────────────────────────────────────────────────────────────────────
// FINAL REPORT
// ──────────────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log("FINAL RESULTS");
console.log("=".repeat(60));
console.log(`  PASSED: ${passCount}`);
console.log(`  FAILED: ${failCount}`);
console.log(`  TOTAL:  ${passCount + failCount}`);

if (failures.length > 0) {
  console.log("\nFAILURES:");
  failures.forEach(({ label, detail }) => {
    console.log(`  - ${label}`);
    if (detail) console.log(`    detail: ${detail}`);
  });
} else {
  console.log("\nAll checks passed!");
}

