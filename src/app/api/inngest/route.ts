import { serve } from "inngest/next";
import { inngest } from "@/../inngest/client";
import { gtmWorkflow } from "@/lib/workflow/orchestrator";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [gtmWorkflow],
});
