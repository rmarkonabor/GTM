import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel, wrapLanguageModel, defaultSettingsMiddleware } from "ai";
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
      // Wrap with defaultSettingsMiddleware to inject providerOptions on every call.
      // This forces jsonTool mode which uses tool-call-based structured output instead
      // of output_config.format — the latter rejects propertyNames and other JSON
      // schema keywords that Zod v4 can generate.
      return wrapLanguageModel({
        model: anthropic(modelId) as LanguageModel,
        middleware: defaultSettingsMiddleware({
          settings: {
            providerOptions: {
              anthropic: { structuredOutputMode: "jsonTool" },
            },
          },
        }),
      }) as LanguageModel;
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId) as LanguageModel;
    }
    default:
      throw new LLMInvalidKeyError();
  }
}
