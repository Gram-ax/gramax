import type { Page } from "@playwright/test";

export async function catalogItemExists(page: Page, catalogName: string, itemPath: string): Promise<boolean> {
	return page.evaluate(
		async ({ catalogName, itemPath }) => {
			const app = await window.app!;
			await app.wm.current().refreshCatalog(catalogName);
			const catalog = await app.wm.current().getContextlessCatalog(catalogName);
			try {
				const fullPath = window.debug.intoPath(`${catalogName}/${itemPath}`);
				const item = catalog.findItemByItemPath(fullPath);
				return item != null;
			} catch {
				return false;
			}
		},
		{ catalogName, itemPath },
	);
}

export async function getArticleContent(page: Page, catalogName: string, itemPath: string): Promise<string | null> {
	return page.evaluate(
		async ({ catalogName, itemPath }) => {
			const app = await window.app!;
			await app.wm.current().refreshCatalog(catalogName);
			const catalog = await app.wm.current().getContextlessCatalog(catalogName);
			try {
				const fullPath = window.debug.intoPath(`${catalogName}/${itemPath}`);
				const item = catalog.findItemByItemPath(fullPath);
				if (!item || item.type !== "article") return null;
				const article = catalog.findArticleByItemRef(item.ref);
				return article.content;
			} catch {
				return null;
			}
		},
		{ catalogName, itemPath },
	);
}
