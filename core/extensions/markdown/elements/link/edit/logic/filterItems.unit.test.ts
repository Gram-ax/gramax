import type { ItemSearchData } from "./filterItems";
import { filterItems } from "./filterItems";

describe("filterItems", () => {
	describe("invalid option — item is shown (return true)", () => {
		test("returns true when option === null", () => {
			expect(filterItems(null as unknown as ItemSearchData, "search")).toBe(true);
		});

		test("returns true when option === undefined", () => {
			expect(filterItems(undefined as unknown as ItemSearchData, "search")).toBe(true);
		});

		test("returns true when label is empty", () => {
			expect(filterItems({ label: "", pathname: "/page" }, "search")).toBe(true);
		});

		test("returns true when pathname is empty", () => {
			expect(filterItems({ label: "Page", pathname: "" }, "search")).toBe(true);
		});

		test("returns true when label is missing", () => {
			expect(filterItems({ pathname: "/page" } as ItemSearchData, "search")).toBe(true);
		});

		test("returns true when pathname is missing", () => {
			expect(filterItems({ label: "Page" } as ItemSearchData, "search")).toBe(true);
		});
	});

	describe("empty search — all items are shown", () => {
		test("returns true when search value is empty", () => {
			expect(filterItems({ label: "Doc", pathname: "/doc" }, "")).toBe(true);
		});

		test("returns true when search value contains only hash", () => {
			expect(filterItems({ label: "Doc", pathname: "/doc" }, "#")).toBe(true);
		});
	});

	describe("search by label", () => {
		test("returns true if search matches label (exact match)", () => {
			expect(filterItems({ label: "Document", pathname: "/other" }, "Document")).toBe(true);
		});

		test("returns true if search is substring of label", () => {
			expect(filterItems({ label: "My Document", pathname: "/x" }, "Doc")).toBe(true);
		});

		test("search case insensitive by label", () => {
			expect(filterItems({ label: "Document", pathname: "/x" }, "document")).toBe(true);
			expect(filterItems({ label: "document", pathname: "/x" }, "DOC")).toBe(true);
		});

		test("returns false if label does not contain search", () => {
			expect(filterItems({ label: "Other", pathname: "/page" }, "Doc")).toBe(false);
		});
	});

	describe("search by pathname", () => {
		test("returns true if search matches pathname", () => {
			expect(filterItems({ label: "Other", pathname: "/docs/page" }, "/docs/page")).toBe(true);
		});

		test("returns true if search is substring of pathname", () => {
			expect(filterItems({ label: "X", pathname: "/docs/my-page" }, "my-page")).toBe(true);
		});

		test("search case insensitive by pathname", () => {
			expect(filterItems({ label: "X", pathname: "/Docs/Page" }, "docs")).toBe(true);
			expect(filterItems({ label: "X", pathname: "/docs/page" }, "PAGE")).toBe(true);
		});

		test("returns false if pathname does not contain search", () => {
			expect(filterItems({ label: "Page", pathname: "/other" }, "docs")).toBe(false);
		});
	});

	describe("search with hash in searchValue", () => {
		test("only the part before # is used for search", () => {
			expect(filterItems({ label: "Section", pathname: "/page" }, "Section#anchor")).toBe(true);
			expect(filterItems({ label: "Section", pathname: "/page" }, "Other#Section")).toBe(false);
		});

		test("only 'foo' is searched when search is 'foo#bar'", () => {
			expect(filterItems({ label: "Foo", pathname: "/x" }, "foo#bar")).toBe(true);
			expect(filterItems({ label: "Bar", pathname: "/x" }, "foo#bar")).toBe(false);
		});
	});

	describe("no matches", () => {
		test("returns false if neither label nor pathname contains search", () => {
			expect(filterItems({ label: "A", pathname: "/a" }, "xyz")).toBe(false);
		});
	});
});
