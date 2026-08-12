import type { Page } from "@playwright/test";

export type AgentSkillSnapshot = {
	name: string;
	description: string;
	content: string;
} | null;

export async function getAgentSkillByName(
	page: Page,
	catalogName: string,
	skillName: string,
): Promise<AgentSkillSnapshot> {
	return page.evaluate(
		async ({ catalogName, skillName }) => {
			const app = await window.app!;
			await app.wm.current().refreshCatalog(catalogName);
			const ctx = await app.contextFactory.fromWeb({ language: "ru" });
			const catalog = await app.wm.current().getContextlessCatalog(catalogName);
			const provider = catalog.customProviders.agentResourcesProvider;
			await provider.readArticles();
			return provider.getSkillByName(app, ctx, window.commands, skillName);
		},
		{ catalogName, skillName },
	);
}
