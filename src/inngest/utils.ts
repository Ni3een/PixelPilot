import { Sandbox } from "@e2b/code-interpreter";

export async function getSandBox(sandboxID: string) {
    const sandbox = await Sandbox.connect(sandboxID);
    return sandbox;
}