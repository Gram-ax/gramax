import type { Page } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

const E2E_API_KEY = "e2e-api-key";

export const AGENT_TEST_ARTICLE_TITLE = "Test Article";

export type AgentFixture = {
	agentPage: Page;
};

async function prepareAgentTest(page: Page): Promise<string> {
	return page.evaluate(async (apiKey) => {
		const commands = await window.debug.commands();
		await commands.agent.session.restore.do({ activeSessionId: null });
		const { id: sessionId } = await commands.agent.session.create.do({});
		localStorage.setItem("agent-enabled", "true");
		localStorage.setItem(
			"agent-state",
			JSON.stringify({
				state: { activeSessionId: sessionId, sessions: [], apiKey },
				version: 0,
			}),
		);
		await commands.agent.session.restore.do({ activeSessionId: sessionId });
		return sessionId;
	}, E2E_API_KEY);
}

async function cleanupAgentTest(page: Page, sessionId: string) {
	await page.evaluate(async (sessionId) => {
		const commands = await window.debug.commands();
		await commands.agent.session.delete.do({ sessionId });
	}, sessionId);
}

export const agentTest = catalogTest.extend<AgentFixture>({
	agentPage: async ({ sharedPage, catalogPage }, use) => {
		const sessionId = await prepareAgentTest(sharedPage);
		await sharedPage.reload({ waitUntil: "domcontentloaded" });
		await catalogPage.waitForLoad();

		await use(sharedPage);

		await cleanupAgentTest(sharedPage, sessionId);
	},
});

export const agentTestOptions = {
	experimentalFeatures: ["agent-chat"],
	startUrl: "/-/-/-/-/agent-test/test-article",
	files: {
		"agent-test": {
			"doc-root.yml": "title: Agent Test\nsyntax: xml\n",
			"test-article.md": "---\ntitle: Test Article\n---\n\n# Hello\n\nOriginal body",
			"target-cat/_index.md": "---\ntitle: Target Cat\n---\n",
		},
	},
};
