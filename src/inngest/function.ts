import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandBox } from "./utils";
import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face Inference
const hf = new HfInference(process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || '');

export const helloWorld = inngest.createFunction(
  { id: "hello-world2" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxID = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("my-nextjs-project")
      return sandbox.sandboxId;
    })

    let output = '';
    try {
      // Using Hugging Face's free inference API
      const response = await hf.textGeneration({
        model: 'gpt2',  // Free model
        inputs: `You are a coding assistant. Generate a simple code snippet based on: ${event.data.value}`,
        parameters: {
          max_new_tokens: 100,
          return_full_text: false,
          temperature: 0.7,
          top_p: 0.9,
        }
      });
      output = response.generated_text || 'No response generated';
    } catch (error) {
      console.error('Error calling Hugging Face API:', error);
      output = 'Error generating response. Please try again later.';
    }

    console.log(output);
    await step.sleep("wait-a-moment", "5s");

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandBox(sandboxID);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    return { output, sandboxUrl };
  },
);