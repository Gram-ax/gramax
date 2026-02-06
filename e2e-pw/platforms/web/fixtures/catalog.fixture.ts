import CatalogPage from "@web/pom/catalog.page";
import { baseTest } from "./base.fixture";

export interface CatalogPageFixture {
	catalogPage: CatalogPage;
}

export const catalogTest = baseTest.extend<CatalogPageFixture>({
	catalogPage: async ({ sharedPage, baseURL }, use) => {
		const catalogPage = new CatalogPage(sharedPage, baseURL!);
		await catalogPage.waitForLoad();
		await use(catalogPage);
	},
});
