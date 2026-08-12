import { expect } from "@playwright/test";
import { AGENT_TEST_ARTICLE_TITLE, agentTest, agentTestOptions } from "./agent.fixture";

agentTest.use(agentTestOptions);

import { installAgentLlmRouteMock, type PlannedCall, uninstallAgentLlmRouteMock } from "./mocks/llmRouteMock";
import { getFailedToolErrors, getInvokedToolNames, getSuccessfulToolNames } from "./mocks/sessionAssertions";
import { getAgentSkillByName } from "./mocks/skillAssertions";

const CATALOG = "agent-test";
const SKILL_NAME = "E2E Test Skill";
const SKILL_BODY = "E2E skill description.\n\n## Rule\n\nAlways greet.";

const plannedCalls: PlannedCall[] = [{ name: "read_agent_skill", args: { skillName: SKILL_NAME } }];

agentTest.beforeEach(async ({ agentPage }) => {
	await installAgentLlmRouteMock(agentPage, plannedCalls);
});

agentTest.afterEach(async ({ agentPage }) => {
	await uninstallAgentLlmRouteMock(agentPage);
});

agentTest("creates skill in UI and agent reads it via read_agent_skill", async ({ agentPage, catalogPage }) => {
	await catalogPage.waitForLoad();
	await expect(agentPage.getByTestId("article-scroll-container")).toBeVisible();

	const catalogActions = await catalogPage.getCatalogActions();
	await catalogActions.open();
	await agentPage.getByRole("menuitem", { name: "Tools" }).hover();
	await agentPage.getByRole("menuitem", { name: "Agent Skills" }).click();
	await agentPage.getByRole("button", { name: "New skill" }).click();

	const editor = agentPage.locator('[data-qa="article-editor"]');
	await expect(editor).toBeVisible();
	await editor.locator(".ProseMirror p").first().click();
	await agentPage.keyboard.insertText(SKILL_NAME);
	await agentPage.keyboard.press("Enter");
	await agentPage.keyboard.insertText(SKILL_BODY);
	await agentPage.waitForTimeout(600);
	await agentPage.keyboard.press("Escape");
	await agentPage.evaluate(async () => {
		await window.debug?.forceSave?.();
	});

	// props.title is indexed separately from the article body, so polling on name alone can pass
	// before the body (description/content) is flushed and re-read. Wait for the full skill.
	await expect
		.poll(async () => {
			const skill = await getAgentSkillByName(agentPage, CATALOG, SKILL_NAME);
			return (
				skill?.name === SKILL_NAME &&
				skill.description.includes("E2E skill description") &&
				skill.content.includes("Always greet")
			);
		})
		.toBe(true);

	await agentPage.locator("[data-qa^='catalog-navigation-']", { hasText: AGENT_TEST_ARTICLE_TITLE }).click();
	await expect(agentPage.getByTestId("article-scroll-container")).toBeVisible();

	await agentPage.locator('[data-qa="top-menu"]').getByRole("button").click();
	const chat = agentPage.getByRole("dialog");
	await expect(chat).toBeVisible();
	const input = chat.getByRole("textbox");
	await input.fill("read the e2e skill");
	await input.press("Enter");

	await expect
		.poll(async () => getSuccessfulToolNames(agentPage).then((names) => names.includes("read_agent_skill")))
		.toBe(true);

	expect(await getFailedToolErrors(agentPage)).toEqual([]);
	expect(await getInvokedToolNames(agentPage)).toContain("read_agent_skill");

	const skill = await getAgentSkillByName(agentPage, CATALOG, SKILL_NAME);
	expect(skill?.name).toBe(SKILL_NAME);
	expect(skill?.description).toContain("E2E skill description");
	expect(skill?.content).toContain("Always greet");
});
