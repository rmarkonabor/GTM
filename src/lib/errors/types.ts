export class GTMError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "GTMError";
  }
}

export class ScrapingError extends GTMError {
  constructor(message: string) {
    super(message, "SCRAPING_ERROR");
    this.name = "ScrapingError";
  }
}

export class ScrapingParseError extends GTMError {
  constructor(message: string) {
    super(message, "SCRAPING_PARSE_ERROR");
    this.name = "ScrapingParseError";
  }
}

export class LLMError extends GTMError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = "LLMError";
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(public retryAfter?: number) {
    super(
      `LLM rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}s` : ""}`,
      "LLM_RATE_LIMIT"
    );
    this.name = "LLMRateLimitError";
  }
}

export class LLMInvalidKeyError extends LLMError {
  constructor() {
    super("Invalid or missing LLM API key. Please check your settings.", "LLM_INVALID_KEY");
    this.name = "LLMInvalidKeyError";
  }
}

export class LLMContextLengthError extends LLMError {
  constructor() {
    super("Input too long for this model. Try a simpler URL or shorter answers.", "LLM_CONTEXT_LENGTH");
    this.name = "LLMContextLengthError";
  }
}

export class LLMTimeoutError extends LLMError {
  constructor() {
    super("LLM response timed out. Please try again.", "LLM_TIMEOUT");
    this.name = "LLMTimeoutError";
  }
}

export class WorkflowError extends GTMError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = "WorkflowError";
  }
}

export class StepDependencyError extends WorkflowError {
  constructor(stepName: string) {
    super(
      `Required step '${stepName}' has not completed successfully yet.`,
      "STEP_DEPENDENCY_ERROR"
    );
    this.name = "StepDependencyError";
  }
}

export function getErrorDetails(err: unknown): { code: string; message: string } {
  if (err instanceof GTMError) {
    return { code: err.code, message: err.message };
  }
  if (err instanceof Error) {
    // Map common HTTP errors from providers
    const msg = err.message.toLowerCase();
    if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid api key")) {
      return { code: "LLM_INVALID_KEY", message: "Invalid or missing API key. Check your settings." };
    }
    if (msg.includes("429") || msg.includes("rate limit")) {
      return { code: "LLM_RATE_LIMIT", message: "Rate limit reached. Please wait and try again." };
    }
    if (msg.includes("context") || msg.includes("token")) {
      return { code: "LLM_CONTEXT_LENGTH", message: "Input too long for this model." };
    }
    return { code: "UNKNOWN_ERROR", message: err.message };
  }
  return { code: "UNKNOWN_ERROR", message: "An unexpected error occurred." };
}
