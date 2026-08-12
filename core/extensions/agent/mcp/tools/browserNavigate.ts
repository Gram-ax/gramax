import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type BrowserNavigateInput = {
	url: string;
};

export async function runBrowserNavigate({
	commands,
	input,
	sessionId,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	if (!sessionId) return fail("Browser tools require an active agent session");
	const { url } = input as BrowserNavigateInput;
	if (!url?.trim()) return fail("url is required");

	try {
		return ok(await commands.agent.browser.navigate.do({ sessionId, url }));
	} catch (error) {
		return fail(error instanceof Error ? error.message : String(error));
	}
}
