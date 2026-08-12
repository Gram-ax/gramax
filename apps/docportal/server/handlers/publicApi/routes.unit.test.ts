import {
	ARTICLE_HTML,
	ARTICLE_RESOURCE,
	CATALOG_NAVIGATION,
	CATALOGS,
	USER_TOKEN,
	WEBHOOK,
	WEBHOOK_REFRESH,
} from "./routes";

describe("publicApi routes", () => {
	describe("WEBHOOK", () => {
		it("matches /api/webhook", () => {
			expect(WEBHOOK.test("/api/webhook")).toBe(true);
		});
		it("does not match /api/webhook/refresh/name", () => {
			expect(WEBHOOK.test("/api/webhook/refresh/name")).toBe(false);
		});
	});

	describe("WEBHOOK_REFRESH", () => {
		it("matches /api/webhook/refresh/my-catalog and captures name", () => {
			const match = "/api/webhook/refresh/my-catalog".match(WEBHOOK_REFRESH);
			expect(match?.[1]).toBe("my-catalog");
		});
		it("does not match empty catalogName", () => {
			expect(WEBHOOK_REFRESH.test("/api/webhook/refresh/")).toBe(false);
		});
		it("does not match extra segment", () => {
			expect(WEBHOOK_REFRESH.test("/api/webhook/refresh/name/extra")).toBe(false);
		});
	});

	describe("USER_TOKEN", () => {
		it("matches /api/user/token", () => {
			expect(USER_TOKEN.test("/api/user/token")).toBe(true);
		});
		it("matches /api/user/token/ with trailing slash", () => {
			expect(USER_TOKEN.test("/api/user/token/")).toBe(true);
		});
		it("does not match /api/user/token/extra", () => {
			expect(USER_TOKEN.test("/api/user/token/extra")).toBe(false);
		});
		it("does not match /api/user", () => {
			expect(USER_TOKEN.test("/api/user")).toBe(false);
		});
	});

	describe("CATALOGS", () => {
		it("matches /api/catalogs", () => {
			expect(CATALOGS.test("/api/catalogs")).toBe(true);
		});
		it("matches /api/catalogs/ with trailing slash", () => {
			expect(CATALOGS.test("/api/catalogs/")).toBe(true);
		});
		it("does not match /api/catalogs/my-catalog", () => {
			expect(CATALOGS.test("/api/catalogs/my-catalog")).toBe(false);
		});
	});

	describe("CATALOG_NAVIGATION", () => {
		it("matches /api/catalogs/my-catalog/navigation", () => {
			expect(CATALOG_NAVIGATION.test("/api/catalogs/my-catalog/navigation")).toBe(true);
		});
		it("matches navigation with trailing slash", () => {
			expect(CATALOG_NAVIGATION.test("/api/catalogs/my-catalog/navigation/")).toBe(true);
		});
		it("captures catalogName", () => {
			const match = "/api/catalogs/my-catalog/navigation".match(CATALOG_NAVIGATION);
			expect(match?.[1]).toBe("my-catalog");
		});
		it("does not match with extra segment", () => {
			expect(CATALOG_NAVIGATION.test("/api/catalogs/my-catalog/navigation/extra")).toBe(false);
		});
		it("does not match empty catalogName", () => {
			expect(CATALOG_NAVIGATION.test("/api/catalogs//navigation")).toBe(false);
		});
	});

	describe("ARTICLE_HTML", () => {
		it("matches /api/catalogs/my-catalog/articles/article-id/html", () => {
			expect(ARTICLE_HTML.test("/api/catalogs/my-catalog/articles/article-id/html")).toBe(true);
		});
		it("matches article html with trailing slash", () => {
			expect(ARTICLE_HTML.test("/api/catalogs/my-catalog/articles/article-id/html/")).toBe(true);
		});
		it("captures catalogName and articleId", () => {
			const match = "/api/catalogs/my-catalog/articles/article-id/html".match(ARTICLE_HTML);
			expect(match?.[1]).toBe("my-catalog");
			expect(match?.[2]).toBe("article-id");
		});
		it("captures and decodes URL-encoded articleId", () => {
			const encoded = encodeURIComponent("path/to/article");
			const match = `/api/catalogs/my-catalog/articles/${encoded}/html`.match(ARTICLE_HTML);
			expect(decodeURIComponent(match?.[2])).toBe("path/to/article");
		});
		it("does not match without /html suffix", () => {
			expect(ARTICLE_HTML.test("/api/catalogs/my-catalog/articles/article-id")).toBe(false);
		});
		it("does not match with extra segment after /html", () => {
			expect(ARTICLE_HTML.test("/api/catalogs/my-catalog/articles/article-id/html/extra")).toBe(false);
		});
	});

	describe("ARTICLE_RESOURCE", () => {
		it("matches /api/catalogs/my-catalog/articles/article-id/resources/image.png", () => {
			expect(ARTICLE_RESOURCE.test("/api/catalogs/my-catalog/articles/article-id/resources/image.png")).toBe(
				true,
			);
		});
		it("matches article resource with trailing slash", () => {
			expect(ARTICLE_RESOURCE.test("/api/catalogs/my-catalog/articles/article-id/resources/image.png/")).toBe(
				true,
			);
		});
		it("captures catalogName, articleId and resourcePath", () => {
			const match = "/api/catalogs/my-catalog/articles/article-id/resources/image.png".match(ARTICLE_RESOURCE);
			expect(match?.[1]).toBe("my-catalog");
			expect(match?.[2]).toBe("article-id");
			expect(match?.[3]).toBe("image.png");
		});
		it("captures and decodes URL-encoded articleId and resourcePath", () => {
			const articleId = encodeURIComponent("path/to/article");
			const resourcePath = encodeURIComponent("assets/img.png");
			const match = `/api/catalogs/my-catalog/articles/${articleId}/resources/${resourcePath}`.match(
				ARTICLE_RESOURCE,
			);
			expect(decodeURIComponent(match?.[2])).toBe("path/to/article");
			expect(decodeURIComponent(match?.[3])).toBe("assets/img.png");
		});
		it("does not match without resources segment", () => {
			expect(ARTICLE_RESOURCE.test("/api/catalogs/my-catalog/articles/article-id")).toBe(false);
		});
		it("does not match empty resourcePath", () => {
			expect(ARTICLE_RESOURCE.test("/api/catalogs/my-catalog/articles/article-id/resources/")).toBe(false);
		});
	});
});
