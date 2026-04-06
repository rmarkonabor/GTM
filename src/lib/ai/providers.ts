import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import { LLMProvider } from "@/types/gtm";
import { getModelForTask, TaskName } from "./router";
import { LLMInvalidKeyError } from "@/lib/errors/types";

export function getLanguageModel(
  provider: LLMProvider,
  apiKey: string,
  task: TaskName
): LanguageModel {
  if (!apiKey) throw new LLMInvalidKeyError();
  const modelId = getModelForTask(provider, task);

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelId) as LanguageModel;
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      // Use jsonTool mode to avoid Anthropic's output_config.format API which
      // has a stricter JSON schema subset (rejects propertyNames and others).
      // jsonTool uses tool-call-based structured output which is more permissive.
      return anthropic(modelId, { structuredOutputMode: "jsonTool" }) as LanguageModel;
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId) as LanguageModel;
    }
    default:
      throw new LLMInvalidKeyError();
  }
}
