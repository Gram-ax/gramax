import { HomePage } from "@web/pom/home.page";
import { baseTest } from "./base.fixture";

export interface HomePageFixture {
	homePage: HomePage;
}

export const homeTest = baseTest.extend<HomePageFixture>({
	homePage: async ({ sharedPage, baseURL }, use) => {
		const homePage = new HomePage(sharedPage, baseURL!);
		await homePage.waitForLoad();
		await homePage.topBar.assertVisible();
		await use(homePage);
	},
});
