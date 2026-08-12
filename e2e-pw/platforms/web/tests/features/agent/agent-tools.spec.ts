import { expect } from "@playwright/test";
import { agentTest, agentTestOptions } from "./agent.fixture";

agentTest.use(agentTestOptions);

import { catalogItemExists } from "./mocks/catalogAssertions";
import { installAgentLlmRouteMock, type PlannedCall, uninstallAgentLlmRouteMock } from "./mocks/llmRouteMock";
import { getFailedToolErrors, getInvokedToolNames, getSuccessfulToolNames } from "./mocks/sessionAssertions";

const CATALOG = "agent-test";
const CREATED_ITEM = "e2e-temp.md";
const MOVE_TARGET = "target-cat/e2e-temp.md";

const plannedCalls: PlannedCall[] = [
	{ name: "list_catalogs", args: {} },
	{ name: "get_navigation", args: { catalogName: CATALOG } },
	{
		name: "create_catalog_item",
		args: { catalogName: CATALOG, type: "article", title: "e2e-temp" },
	},
	{ name: "read_catalog_item", args: { catalogName: CATALOG, itemPath: "test-article.md" } },
	{ name: "get_catalog_item_headings", args: { catalogName: CATALOG, itemPath: "test-article.md" } },
	{ name: "search_catalogs", args: { query: "Hello", catalogName: CATALOG } },
	{
		name: "write_catalog_item",
		args: {
			catalogName: CATALOG,
			itemPath: CREATED_ITEM,
			content: '---\ntitle: "Updated by agent"\n---\n\nE2E updated body.\n',
		},
	},
	{
		name: "move_catalog_item",
		args: { catalogName: CATALOG, fromItemPath: CREATED_ITEM, toItemPath: MOVE_TARGET },
	},
	{ name: "delete_catalog_item", args: { catalogName: CATALOG, itemPath: MOVE_TARGET } },
];

const EXCLUDED_TOOLS = ["read_agent_skill", "read_agent_attachment", "git_inspect", "git_discard"] as const;

agentTest.beforeEach(async ({ agentPage }) => {
	await installAgentLlmRouteMock(agentPage, plannedCalls);
});

agentTest.afterEach(async ({ agentPage }) => {
	await uninstallAgentLlmRouteMock(agentPage);
});

agentTest("runs tool scenario and applies catalog side effects", async ({ agentPage, catalogPage }) => {
	await catalogPage.waitForLoad();
	await expect(agentPage.getByTestId("article-scroll-container")).toBeVisible();

	await agentPage.locator('[data-qa="top-menu"]').getByRole("button").click();
	const chat = agentPage.getByRole("dialog");
	await expect(chat).toBeVisible();
	const input = chat.getByRole("textbox");
	await input.fill("run e2e tool scenario");
	await input.press("Enter");

	await expect
		.poll(async () => {
			const names = await getSuccessfulToolNames(agentPage);
			return plannedCalls.every((call) => names.includes(call.name));
		})
		.toBe(true);

	const failed = await getFailedToolErrors(agentPage);
	expect(failed, `failed tools: ${failed.join("; ")}`).toEqual([]);

	const invoked = await getInvokedToolNames(agentPage);
	expect(invoked, `invoked tools: ${invoked.join(", ")}`).toEqual(
		expect.arrayContaining(plannedCalls.map((call) => call.name)),
	);
	for (const name of EXCLUDED_TOOLS) {
		expect(invoked).not.toContain(name);
	}

	await expect.poll(() => catalogItemExists(agentPage, CATALOG, CREATED_ITEM)).toBe(false);
	await expect.poll(() => catalogItemExists(agentPage, CATALOG, MOVE_TARGET)).toBe(false);
});
