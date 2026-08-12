import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type BrowserTypeInput = {
	elementId: string;
	text: string;
};

export async function runBrowserType({
	commands,
	input,
	sessionId,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	if (!sessionId) return fail("Browser tools require an active agent session");
	const { elementId, text } = input as BrowserTypeInput;
	if (!elementId?.trim()) return fail("elementId is required");

	try {
		return ok(await commands.agent.browser.type.do({ sessionId, elementId, text }));
	} catch (error) {
		return fail(error instanceof Error ? error.message : String(error));
	}
}
