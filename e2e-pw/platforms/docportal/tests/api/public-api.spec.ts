import { baseTest as test } from "@docportal/fixtures/base.fixture";
import { expect } from "@playwright/test";

test.use({ source: "env", user: "env" });

const RESOURCE_PATH = "./export.puml";

test.describe("public API", () => {
	test("basic usage (get catalogs)", async ({ basePage }, testInfo) => {
		const baseURL = testInfo.project.use.baseURL;
		const request = basePage.page.request;

		const catalogsResponse = await request.get(`${baseURL}/api/catalogs/`);
		expect(catalogsResponse.ok()).toBe(true);
		const catalogs = await catalogsResponse.json();
		expect(catalogs.data.length).toBeGreaterThan(0);

		const catalogId = catalogs.data[0].id;

		const navigationResponse = await request.get(`${baseURL}/api/catalogs/${catalogId}/navigation`);
		expect(navigationResponse.ok()).toBe(true);
		const navigation = await navigationResponse.json();
		expect(navigation.data.length).toBeGreaterThan(0);

		const lastArticleId = navigation.data[navigation.data.length - 1].id;

		const htmlResponse = await request.get(
			`${baseURL}/api/catalogs/${catalogId}/articles/${encodeURIComponent(lastArticleId)}/html`,
		);
		expect(htmlResponse.ok()).toBe(true);
		const html = await htmlResponse.text();
		expect(html.length).toBeGreaterThan(0);

		const resourceResponse = await request.get(
			`${baseURL}/api/catalogs/${catalogId}/articles/${encodeURIComponent(lastArticleId)}/resources/${encodeURIComponent(RESOURCE_PATH)}`,
		);
		expect(resourceResponse.ok()).toBe(true);
		expect(resourceResponse.headers()["content-type"]).toBe("application/puml");

		const content = (await resourceResponse.text()).replaceAll("\r", "");
		expect(content).toBe("@startuml\nBob -> Alice : hello\n@enduml");
	});
});
