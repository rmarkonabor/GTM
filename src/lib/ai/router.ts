import { TaskComplexity, LLMProvider } from "@/types/gtm";

export type TaskName =
  | "research-enrichment"
  | "clarifying-questions"
  | "industry-priority"
  | "icp-creation"
  | "target-markets"
  | "segmentation"
  | "competitive-analysis"
  | "manifesto"
  | "cold-email"
  | "expand-step"
  | "format-for-export"
  | "step-summary"
  | "error-explanation"
  | "filter-translation";

const TASK_COMPLEXITY: Record<TaskName, TaskComplexity> = {
  "research-enrichment": "COMPLEX",
  "clarifying-questions": "MEDIUM",
  "industry-priority": "COMPLEX",
  "icp-creation": "COMPLEX",
  "target-markets": "COMPLEX",
  "segmentation": "MEDIUM",
  "competitive-analysis": "COMPLEX",
  "manifesto": "COMPLEX",
  "cold-email": "COMPLEX",
  "expand-step": "COMPLEX",
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
