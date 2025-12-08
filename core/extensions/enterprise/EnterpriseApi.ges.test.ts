/**
 * @jest-environment node
 */

import EnterpriseApi from "./EnterpriseApi";

const enterpriseApi = new EnterpriseApi("https://enterprise.gramax.local");

const workspaceOwnerUserToken = process.env.WORKSPACE_OWNER_USER_TOKEN;
const catalogOwnerUserToken = process.env.CATALOG_OWNER_USER_TOKEN;
const editorUserToken = process.env.EDITOR_USER_TOKEN;
const reviewerUserToken = process.env.REVIEWER_USER_TOKEN;
const readerUserToken = process.env.READER_USER_TOKEN;

describe("EnterpriseApi", () => {
	it("should be defined", async () => {
		expect(await enterpriseApi.check()).toBe(true);
	});

	describe("workspace owner user", () => {
		let user: Awaited<ReturnType<typeof enterpriseApi.getUser>>;
		beforeAll(async () => {
			console.log("workspaceOwnerUserToken", workspaceOwnerUserToken);
			user = await enterpriseApi.getUser(workspaceOwnerUserToken);
		});
		it("should have correct user info", () => {
			expect(user.info.mail).toBe("workspace-owner@test.com");
		});
		it("should have correct catalogs names", () => {
			expect(Object.keys(user.catalogsPermissions).sort()).toEqual([
				"catalog-owner",
				"editor",
				"reader",
				"reviewer",
				"test-catalog",
			]);
		});
		it("should have correct workspace permissions", () => {
			expect(user.workspacePermissions).toEqual([
				"ConfigureWorkspace",
				"ConfigureCatalog",
				"ReadWorkspace",
				"EditCatalog",
				"EditCatalogContent",
				"ReadCatalogContent",
			]);
		});
		it("should have correct catalogs permissions", () => {
			Object.values(user.catalogsPermissions).forEach((permissions) =>
				expect(permissions).toEqual([
					"ConfigureWorkspace",
					"ConfigureCatalog",
					"ReadWorkspace",
					"EditCatalog",
					"EditCatalogContent",
					"ReadCatalogContent",
				]),
			);
		});
	});

	describe("catalog owner user", () => {
		let user: Awaited<ReturnType<typeof enterpriseApi.getUser>>;
		beforeAll(async () => {
			console.log("catalogOwnerUserToken", catalogOwnerUserToken);
			user = await enterpriseApi.getUser(catalogOwnerUserToken);
		});
		it("should have correct user info", () => {
			expect(user.info.mail).toBe("catalog-owner@test.com");
		});
		it("should have correct catalogs names", () => {
			expect(Object.keys(user.catalogsPermissions).sort()).toEqual(["catalog-owner", "test-catalog"]);
		});
		it("should have correct workspace permissions", () => {
			expect(user.workspacePermissions).toEqual([
				"ReadWorkspace",
				"EditCatalog",
				"EditCatalogContent",
				"ReadCatalogContent",
			]);
		});
		it("should have correct catalogs permissions", () => {
			Object.values(user.catalogsPermissions).forEach((permissions) =>
				expect(permissions).toEqual([
					"ConfigureCatalog",
					"ReadWorkspace",
					"EditCatalog",
					"EditCatalogContent",
					"ReadCatalogContent",
				]),
			);
		});
	});

	describe("editor user", () => {
		let user: Awaited<ReturnType<typeof enterpriseApi.getUser>>;
		beforeAll(async () => {
			user = await enterpriseApi.getUser(editorUserToken);
		});
		it("should have correct user info", () => {
			expect(user.info.mail).toBe("editor@test.com");
		});
		it("should have correct catalogs names", () => {
			expect(Object.keys(user.catalogsPermissions).sort()).toEqual(["editor", "test-catalog"]);
		});
		it("should have correct workspace permissions", () => {
			expect(user.workspacePermissions).toEqual([
				"ReadWorkspace",
				"EditCatalog",
				"EditCatalogContent",
				"ReadCatalogContent",
			]);
		});
		it("should have correct catalogs permissions", () => {
			Object.values(user.catalogsPermissions).forEach((permissions) =>
				expect(permissions).toEqual([
					"ReadWorkspace",
					"EditCatalog",
					"EditCatalogContent",
					"ReadCatalogContent",
				]),
			);
		});
	});

	describe("reviewer user", () => {
		let user: Awaited<ReturnType<typeof enterpriseApi.getUser>>;
		beforeAll(async () => {
			user = await enterpriseApi.getUser(reviewerUserToken);
		});
		it("should have correct user info", () => {
			expect(user.info.mail).toBe("reviewer@test.com");
		});
		it("should have correct catalogs names", () => {
			expect(Object.keys(user.catalogsPermissions).sort()).toEqual(["reviewer", "test-catalog"]);
		});
		it("should have correct workspace permissions", () => {
			expect(user.workspacePermissions).toEqual([]);
		});
		it("should have correct catalogs permissions", () => {
			Object.values(user.catalogsPermissions).forEach((permissions) =>
				expect(permissions).toEqual(["EditCatalogContent", "ReadCatalogContent"]),
			);
		});
	});

	describe("reader user", () => {
		let user: Awaited<ReturnType<typeof enterpriseApi.getUser>>;
		beforeAll(async () => {
			user = await enterpriseApi.getUser(readerUserToken);
		});
		it("should have correct user info", () => {
			expect(user.info.mail).toBe("reader@test.com");
		});
		it("should have correct catalogs names", () => {
			expect(Object.keys(user.catalogsPermissions).sort()).toEqual(["reader", "test-catalog"]);
		});
		it("should have correct workspace permissions", () => {
			expect(user.workspacePermissions).toEqual([]);
		});
		it("should have correct catalogs permissions", () => {
			Object.values(user.catalogsPermissions).forEach((permissions) =>
				expect(permissions).toEqual(["ReadCatalogContent"]),
			);
		});
	});
});
