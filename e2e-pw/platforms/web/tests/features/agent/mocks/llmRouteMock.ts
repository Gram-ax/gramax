import type { Page } from "@playwright/test";
import { buildSseBody, buildSseStop, buildSseToolCall } from "./sse";

export type PlannedCall = { name: string; args: Record<string, unknown> };

const LLM_ROUTE_PATTERN = "**/*chat/completions**";

export async function installAgentLlmRouteMock(page: Page, plannedCalls: PlannedCall[]) {
	let iteration = 0;

	await page.route(LLM_ROUTE_PATTERN, async (route) => {
		const body = route.request().postDataJSON() as { tools?: unknown[] } | null;
		if (!body?.tools?.length) {
			await route.fulfill({
				status: 200,
				contentType: "text/event-stream",
				body: buildSseBody([buildSseStop("E2E auto title")]),
			});
			return;
		}

		const next = plannedCalls[iteration];
		if (next) {
			iteration += 1;
			await route.fulfill({
				status: 200,
				contentType: "text/event-stream",
				body: buildSseBody([buildSseToolCall(next.name, next.args, `e2e-call-${iteration}`)]),
			});
			return;
		}

		await route.fulfill({
			status: 200,
			contentType: "text/event-stream",
			body: buildSseBody([buildSseStop("E2E mock scenario complete.")]),
		});
	});
}

export async function uninstallAgentLlmRouteMock(page: Page) {
	await page.unroute(LLM_ROUTE_PATTERN);
}
