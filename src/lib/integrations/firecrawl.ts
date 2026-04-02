import { ScrapingError, ScrapingParseError } from "@/lib/errors/types";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

export async function scrapeUrl(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new ScrapingError("Firecrawl API key not configured.");
  }

  let response: Response;
  try {
    response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      }),
    });
  } catch (err) {
    throw new ScrapingError(`Failed to reach scraping service: ${(err as Error).message}`);
  }

  if (response.status === 402) {
    throw new ScrapingError("Firecrawl free tier limit reached. Please check your Firecrawl account.");
  }

  if (!response.ok) {
    throw new ScrapingError(`Scraping failed with status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.success || !data.data?.markdown) {
    throw new ScrapingParseError(
      "Could not extract readable content from this URL. The page may be login-protected or heavily JavaScript-rendered."
    );
  }

  const markdown = data.data.markdown as string;
  if (markdown.trim().length < 100) {
    throw new ScrapingParseError(
      "The scraped content was too short to analyze. Please check the URL or try a different page."
    );
  }

  // Truncate to avoid LLM context limits (~12K chars ≈ 3K tokens)
  return markdown.slice(0, 12000);
}
