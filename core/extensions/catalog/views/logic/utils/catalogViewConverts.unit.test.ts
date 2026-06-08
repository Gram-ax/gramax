import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import {
	convertCatalogViewIdToScope,
	convertScopeToCatalogViewId,
	getCatalogViewIDFromPath,
	removeCatalogViewScopeFromPath,
} from "./catalogViewConverts";

jest.mock("@core/RouterPath/RouterPathProvider", () => ({
	// biome-ignore lint/style/useNamingConvention: expected
	__esModule: true,
	default: {
		parsePath: jest.fn((path: string) => ({
			catalogName: path.split("/")[1] ?? "",
			filePath: path.split("/").slice(2),
		})),
		getPathname: jest.fn((data: { catalogName: string; filePath: string[] }) => ({
			value: `/${data.catalogName}/${data.filePath.join("/")}`,
		})),
	},
}));

jest.mock("@ext/versioning/addScopeToPath", () => ({
	addScopeToPath: jest.fn((path: string) => {
		if (typeof path === "string" && path.includes(":")) {
			const parts = path.split("/");
			parts[0] = parts[0].split(":")[0];
			return parts.join("/");
		}
		return path;
	}),
}));

const makeView = (id: string): CatalogView => ({
	id,
	name: `View ${id}`,
	filters: [],
	properties: [],
});

describe("convertCatalogViewIdToScope", () => {
	test("prefixes view id with 'view-'", () => {
		expect(convertCatalogViewIdToScope(makeView("abc123"))).toBe("view-abc123");
	});

	test("handles empty id", () => {
		expect(convertCatalogViewIdToScope(makeView(""))).toBe("view-");
	});

	test("handles id that already contains 'view-'", () => {
		expect(convertCatalogViewIdToScope(makeView("view-nested"))).toBe("view-view-nested");
	});
});

describe("convertScopeToCatalogViewId", () => {
	test("extracts id from scope string", () => {
		expect(convertScopeToCatalogViewId("view-abc123")).toBe("abc123");
	});

	test("returns undefined for string without 'view-' prefix", () => {
		expect(convertScopeToCatalogViewId("other-scope")).toBeUndefined();
	});

	test("returns empty string for 'view-' alone", () => {
		expect(convertScopeToCatalogViewId("view-")).toBe("");
	});

	test("split stops at first 'view-' — nested prefix returns empty string", () => {
		expect(convertScopeToCatalogViewId("view-view-nested")).toBe("");
	});

	test("roundtrips with simple id (no dashes containing 'view-')", () => {
		const view = makeView("abc123");
		const scope = convertCatalogViewIdToScope(view);
		expect(convertScopeToCatalogViewId(scope)).toBe("abc123");
	});

	test("does not roundtrip when id contains 'view-' substring", () => {
		const view = makeView("my-view-42");
		const scope = convertCatalogViewIdToScope(view);
		expect(convertScopeToCatalogViewId(scope)).not.toBe("my-view-42");
	});
});

describe("getCatalogViewIDFromPath", () => {
	test("extracts id from path containing view-<id>", () => {
		expect(getCatalogViewIDFromPath("/source/group/repo/ref/view-abc123/file")).toBe("abc123");
	});

	test("extracts id from path where view segment is at the end", () => {
		expect(getCatalogViewIDFromPath("/something/view-42")).toBe("42");
	});

	test("returns undefined when path has no view segment", () => {
		expect(getCatalogViewIDFromPath("/source/group/repo/ref/catalog/file")).toBeUndefined();
	});

	test("extracts first view-<id> when multiple present", () => {
		expect(getCatalogViewIDFromPath("/view-first/view-second")).toBe("first");
	});

	test("returns undefined for empty path", () => {
		expect(getCatalogViewIDFromPath("")).toBeUndefined();
	});

	test("handles id with dashes", () => {
		expect(getCatalogViewIDFromPath("/catalog/view-some-long-id/file")).toBe("some-long-id");
	});
});

describe("removeCatalogViewScopeFromPath", () => {
	test("non-editor path delegates to addScopeToPath directly", () => {
		const result = removeCatalogViewScopeFromPath("catalog:view-1/article", {
			isEditorPath: false,
		});

		expect(result).toBe("catalog/article");
	});

	test("editor path parses, removes scope from catalogName, and rebuilds", () => {
		const result = removeCatalogViewScopeFromPath("/catalog:scope/file", {
			isEditorPath: true,
		});

		expect(result).toBe("/catalog/file");
	});

	test("editor path uses options.catalogName when parsePath returns no catalogName", () => {
		const RouterPathProvider = jest.requireMock("@core/RouterPath/RouterPathProvider").default;
		RouterPathProvider.parsePath.mockReturnValueOnce({
			catalogName: null,
			filePath: ["article"],
		});

		const result = removeCatalogViewScopeFromPath("/something/article", {
			isEditorPath: true,
			catalogName: "fallback-catalog",
		});

		expect(RouterPathProvider.getPathname).toHaveBeenCalledWith(
			expect.objectContaining({ catalogName: "fallback-catalog" }),
		);
		expect(typeof result).toBe("string");
	});
});
