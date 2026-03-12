import { baseTest as test } from "@docportal/fixtures/base.fixture";
import { expect } from "@playwright/test";
import { parseStringPromise } from "xml2js";

test.use({ source: "env", user: "env" });

interface SitemapUrl {
	loc: string[];
	lastmod?: string[];
	changefreq?: string[];
	priority?: string[];
}

interface SitemapIndex {
	sitemapindex: {
		sitemap: SitemapUrl[];
	};
}

interface Sitemap {
	urlset: {
		url: SitemapUrl[];
	};
}

const TEST_CATALOG_NAME = "test-catalog";

test.describe("SEO API", () => {
	test.describe("Sitemaps", () => {
		test("workspace sitemap contains only catalog links", async ({ basePage }, testInfo) => {
			const baseURL = testInfo.project.use.baseURL;
			const request = basePage.page.request;

			const response = await request.get(`${baseURL}/sitemap.xml`);
			expect(response.status()).toBe(200);

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/xml");

			const xmlText = await response.text();
			expect(xmlText).toBeTruthy();

			const parsedXml = (await parseStringPromise(xmlText)) as SitemapIndex;

			expect(parsedXml.sitemapindex).toBeDefined();
			expect(Array.isArray(parsedXml.sitemapindex.sitemap)).toBe(true);
			expect(parsedXml.sitemapindex.sitemap.length).toBeGreaterThan(0);

			const urlEntrys = parsedXml.sitemapindex.sitemap;
			const testCatalog = urlEntrys.find(
				(entry) => entry.loc[0] === `${baseURL}/api/sitemap/${TEST_CATALOG_NAME}`,
			);
			expect(testCatalog).toBeDefined();
		});

		test("catalog sitemap contains articles", async ({ basePage }, testInfo) => {
			const baseURL = testInfo.project.use.baseURL;
			const request = basePage.page.request;

			// First, get workspace sitemap to find a catalog
			const workspaceResponse = await request.get(`${baseURL}/sitemap.xml`);
			const workspaceXml = await workspaceResponse.text();
			const parsedWorkspace = (await parseStringPromise(workspaceXml)) as SitemapIndex;

			const catalogEntry = parsedWorkspace.sitemapindex.sitemap.find(
				(entry) => entry.loc[0] === `${baseURL}/api/sitemap/${TEST_CATALOG_NAME}`,
			) as SitemapUrl;
			expect(catalogEntry).toBeDefined();
			const catalogUrl = catalogEntry.loc[0] as string;

			const catalogResponse = await request.get(catalogUrl);
			expect(catalogResponse.status()).toBe(200);

			const contentType = catalogResponse.headers()["content-type"];
			expect(contentType).toContain("application/xml");

			const catalogXml = await catalogResponse.text();
			expect(catalogXml).toBeTruthy();

			const parsedCatalog = (await parseStringPromise(catalogXml)) as Sitemap;

			expect(parsedCatalog.urlset).toBeDefined();
			expect(Array.isArray(parsedCatalog.urlset.url)).toBe(true);
			expect(parsedCatalog.urlset.url.length).toBeGreaterThan(0);

			const urlEntrys = parsedCatalog.urlset.url;
			const testCatalog = urlEntrys.find((entry) => entry.loc[0] === `${baseURL}/${TEST_CATALOG_NAME}/catalog`);
			expect(testCatalog).toBeDefined();
		});
	});

	test.describe("Robots.txt", () => {
		test("robots.txt has correct content", async ({ basePage }, testInfo) => {
			const baseURL = testInfo.project.use.baseURL;
			const request = basePage.page.request;

			const response = await request.get(`${baseURL}/robots.txt`);
			expect(response.status()).toBe(200);

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("text/plain");

			const robotsText = await response.text();

			const expectedContent = `User-agent: *
Disallow: /admin/
Disallow: /api/*
Allow: /api/sitemap/*

Sitemap: ${baseURL}/sitemap.xml`;

			expect(robotsText.trim()).toBe(expectedContent.trim());
		});
	});
});
