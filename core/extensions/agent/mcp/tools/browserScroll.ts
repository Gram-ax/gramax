import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

export async function runBrowserScroll({ commands, sessionId }: ToolExecutionContext): Promise<ToolExecutionResult> {
	if (!sessionId) return fail("Browser tools require an active agent session");

	try {
		return ok(await commands.agent.browser.scroll.do({ sessionId }));
	} catch (error) {
		return fail(error instanceof Error ? error.message : String(error));
	}
}
