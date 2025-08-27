import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { helloWorld } from "@/inngest/function";

// Create the Inngest API endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld],
});
