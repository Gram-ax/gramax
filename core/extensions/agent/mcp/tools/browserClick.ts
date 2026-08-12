import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type BrowserClickInput = {
	elementId: string;
};

export async function runBrowserClick({
	commands,
	input,
	sessionId,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	if (!sessionId) return fail("Browser tools require an active agent session");
	const { elementId } = input as BrowserClickInput;
	if (!elementId?.trim()) return fail("elementId is required");

	try {
		return ok(await commands.agent.browser.click.do({ sessionId, elementId }));
	} catch (error) {
		return fail(error instanceof Error ? error.message : String(error));
	}
}
