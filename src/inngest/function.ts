import { openai, createAgent, createTool, createNetwork, gemini, type Tool} from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandBox, lastAssistanceTextMessageContent } from "./utils";
import { z } from "zod"
import { PROMPT } from "../prompt";
import {prisma} from "@/lib/db"

interface AgentState{
  summary:string;
  files:{[path:string]:string};
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-Agent" },
  { event: "code-Agent/run" },
  async ({ event, step }) => {
    // Create or get sandbox ID
    const sandboxID = await step.run("get-sandbox-box", async () => {
      const sandbox = await Sandbox.create("my-nextjs-project");
      return sandbox.sandboxId;
    });

    // Define code agent with tools
    const codeAgent = createAgent<AgentState>({
      name: "codeAgent",
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-pro", apiKey: "AIzaSyDRbjXkgvDdTywTBUCuXpK9w9YXPJFdJkU" }),
      tools: [
        createTool({
          name: "terminal",
          description: "use the terminal to run the commands",
          parameters: z.object({
          command: z.string(),
          }),
          handler: async ({ command }) => {
            const buffers = { stdout: "", stderr: "" };
            try {
              const sandbox = await getSandBox(sandboxID);
              const result = await sandbox.commands.run(command, {
                onStdout: (data: string) => {
                  buffers.stdout += data;
                },
                onStderr: (data: string) => {
                  buffers.stderr += data;
                },
              });
              return result.stdout;
            } catch (e) {
              console.error(
                `command failed: ${e}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
              );
              return `Command failed: ${e} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
            }
          },
        }),
        createTool({
          name: "createOrUpdatedfiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async (
            { files },
             { network }: Tool.Options<AgentState>
          ) => {
            try {
              const sandbox = await getSandBox(sandboxID);
              const updatedfiles = network.state.data.files || {};
              for (const file of files) {
                await sandbox.files.write(file.path, file.content);
                updatedfiles[file.path] = file.content;
              }
              return updatedfiles;
            } catch (e) {
              console.error(e);
              throw e;
            }
          },
        }),
        
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }) => {
            try {
              const sandbox = await getSandBox(sandboxID);
              const contents = [];
              for (const file of files) {
                const content = await sandbox.files.read(file);
                contents.push({ path: file, content });
              }
              return JSON.stringify(contents);
            } catch (e) {
              return "error: " + e;
            }
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistanceMessageText = lastAssistanceTextMessageContent(result);
          if (lastAssistanceMessageText && network) {
            if (lastAssistanceMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistanceMessageText;
            }
          }
          return result;
        }
      }
    });

    const network = createNetwork<AgentState>({
      name: "coding agent network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      }
    });

    // Run the agent with the input from event data
    const result = await network.run(event.data.value);

    const isError = 
      !result.state.data.summary || 
      Object.keys(result.state.data.files || {}).length === 0;
    
    // Get sandbox URL
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandBox(sandboxID);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: "Something went wrong",
            role: "ASSISTANT",
            type: "ERROR",
          }
        });
      }
      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragement: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
