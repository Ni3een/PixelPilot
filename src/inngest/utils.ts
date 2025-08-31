import {Sandbox} from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

export async function getSandBox(sandboxID:string){
    const sandbox=await Sandbox.connect(sandboxID)
        return sandbox;
};
export function lastAssistanceTextMessageContent(result:AgentResult){
    const lastAssistanceTextMessageContent=result.output.findLastIndex(
        (message)=>message.role==="assistant",
    );

    const message=result.output[lastAssistanceTextMessageContent] as
    TextMessage;
    undefined;

    return message?.content
    ? typeof message.content==="string"
    ? message.content
    : message.content.map((c)=>c.text).join("")
    : undefined;
};