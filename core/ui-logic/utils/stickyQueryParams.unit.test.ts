import { getStickyParams } from "@core-ui/utils/stickyQueryParams";

jest.mock("@core/RouterPath/RouterPathProvider", () => ({
	// biome-ignore lint/style/useNamingConvention: expected
	__esModule: true,
	default: {
		parsePath: jest.fn((path: string) => ({
			catalogName: path.split("/")[1] ?? "",
		})),
	},
}));

const setSearch = (params: Record<string, string>) => {
	Object.defineProperty(window, "location", {
		value: { search: `?${new URLSearchParams(params).toString()}` },
		writable: true,
	});
};

describe("getStickyParams", () => {
	describe("no catalog in path", () => {
		test("returns empty object when path has no catalog", () => {
			setSearch({ view: "table", mode: "markdown" });
			expect(getStickyParams("/")).toEqual({});
		});
	});

	describe("view=* pattern", () => {
		test("keeps view with any value", () => {
			setSearch({ view: "table" });
			expect(getStickyParams("/catalog/article")).toEqual({ view: "table" });
		});

		test("keeps view with another value", () => {
			setSearch({ view: "grid" });
			expect(getStickyParams("/catalog/article")).toEqual({ view: "grid" });
		});
	});

	describe("mode=markdown pattern", () => {
		test("keeps mode when value is markdown", () => {
			setSearch({ mode: "markdown" });
			expect(getStickyParams("/catalog/article")).toEqual({ mode: "markdown" });
		});

		test("drops mode when value is not markdown", () => {
			setSearch({ mode: "wysiwyg" });
			expect(getStickyParams("/catalog/article")).toEqual({});
		});

		test("drops mode when value is empty", () => {
			setSearch({ mode: "" });
			expect(getStickyParams("/catalog/article")).toEqual({});
		});
	});

	describe("combined params", () => {
		test("keeps both view and mode=markdown", () => {
			setSearch({ view: "table", mode: "markdown" });
			expect(getStickyParams("/catalog/article")).toEqual({ view: "table", mode: "markdown" });
		});

		test("keeps view but drops mode=wysiwyg", () => {
			setSearch({ view: "table", mode: "wysiwyg" });
			expect(getStickyParams("/catalog/article")).toEqual({ view: "table" });
		});
	});

	describe("unknown params", () => {
		test("drops params not matching any pattern", () => {
			setSearch({ foo: "bar", view: "list" });
			expect(getStickyParams("/catalog/article")).toEqual({ view: "list" });
		});
	});
});
