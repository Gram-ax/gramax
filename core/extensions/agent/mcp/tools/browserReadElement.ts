import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type BrowserReadElementInput = {
	elementId: string;
};

export async function runBrowserReadElement({
	commands,
	input,
	sessionId,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	if (!sessionId) return fail("Browser tools require an active agent session");
	const { elementId } = input as BrowserReadElementInput;
	if (!elementId?.trim()) return fail("elementId is required");

	try {
		return ok(await commands.agent.browser.readElement.do({ sessionId, elementId }));
	} catch (error) {
		return fail(error instanceof Error ? error.message : String(error));
	}
}
