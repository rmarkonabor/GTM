import { TaskComplexity, LLMProvider } from "@/types/gtm";

export type TaskName =
  | "research-enrichment"
  | "clarifying-questions"
  | "target-markets"
  | "industry-priority"
  | "icp-creation"
  | "segmentation"
  | "market-sizing-analysis"
  | "competitive-analysis"
  | "positioning"
  | "manifesto"
  | "format-for-export"
  | "step-summary"
  | "error-explanation"
  | "filter-translation";

const TASK_COMPLEXITY: Record<TaskName, TaskComplexity> = {
  "research-enrichment": "COMPLEX",
  "clarifying-questions": "MEDIUM",
  "target-markets": "COMPLEX",
  "industry-priority": "COMPLEX",
  "icp-creation": "COMPLEX",
  "segmentation": "MEDIUM",
  "market-sizing-analysis": "COMPLEX",
  "competitive-analysis": "COMPLEX",
  "positioning": "COMPLEX",
  "manifesto": "COMPLEX",
  "format-for-export": "SIMPLE",
  "step-summary": "SIMPLE",
  "error-explanation": "SIMPLE",
  "filter-translation": "SIMPLE",
};

const MODEL_TIER: Record<LLMProvider, Record<TaskComplexity, string>> = {
  openai: {
    COMPLEX: "gpt-4o",
    MEDIUM: "gpt-4o-mini",
    SIMPLE: "gpt-4o-mini",
  },
  anthropic: {
    COMPLEX: "claude-sonnet-4-6",
    MEDIUM: "claude-sonnet-4-6",
    SIMPLE: "claude-haiku-4-5-20251001",
  },
  google: {
    COMPLEX: "gemini-2.0-pro-exp",
    MEDIUM: "gemini-2.0-flash",
    SIMPLE: "gemini-2.0-flash",
  },
};

export function getModelForTask(provider: LLMProvider, task: TaskName): string {
  const complexity = TASK_COMPLEXITY[task];
  return MODEL_TIER[provider][complexity];
}

export function getTaskComplexity(task: TaskName): TaskComplexity {
  return TASK_COMPLEXITY[task];
}
