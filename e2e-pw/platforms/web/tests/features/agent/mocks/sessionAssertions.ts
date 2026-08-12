import type { Page } from "@playwright/test";

function getLatestSession(page: Page) {
	return page.evaluate(async () => {
		const commands = await window.debug.commands();
		const { sessions } = await commands.agent.session.list.do({});
		const idle = sessions.filter((s) => !s.processing);
		return idle.at(-1) ?? sessions.at(-1) ?? null;
	});
}

export async function getSuccessfulToolNames(page: Page): Promise<string[]> {
	const session = await getLatestSession(page);
	if (!session) return [];
	return session.events.filter((e) => e.type === "tool_result" && !e.isError).map((e) => e.name);
}

export async function getInvokedToolNames(page: Page): Promise<string[]> {
	const session = await getLatestSession(page);
	if (!session) return [];
	const names = new Set<string>();
	for (const event of session.events) {
		if (event.type === "tool_call_requested" || event.type === "tool_result") {
			names.add(event.name);
		}
	}
	return [...names];
}

export async function getFailedToolErrors(page: Page): Promise<string[]> {
	const session = await getLatestSession(page);
	if (!session) return [];
	return session.events
		.filter((e) => e.type === "tool_result" && e.isError)
		.map((e) => `${e.name}: ${e.contentPreview}`);
}
