import { Mark } from "@tiptap/pm/model";
import { getHref } from "./getHref";

const createMockMark = (attrs: Record<string, any>): Mark => {
	return {
		attrs,
	} as Mark;
};

describe("getHref", () => {
	describe("when newHref is provided", () => {
		test("returns newHref value", () => {
			const mark = createMockMark({
				href: "/old-path",
				newHref: "/new-path",
			});

			const result = getHref(mark);

			expect(result).toBe("/new-path");
		});

		test("falls back to href when newHref is empty string", () => {
			const mark = createMockMark({
				href: "/some-path",
				newHref: "",
			});

			const result = getHref(mark);

			expect(result).toBe("/some-path");
		});
	});

	describe("when href is anchor link", () => {
		test("returns href with hash when starts with # and length > 1", () => {
			const mark = createMockMark({
				href: "#section",
				hash: "?query=1",
			});

			const result = getHref(mark);

			expect(result).toBe("#section?query=1");
		});

		test("returns href with empty hash when hash is not provided", () => {
			const mark = createMockMark({
				href: "#section",
			});

			const result = getHref(mark);

			expect(result).toBe("#section");
		});

		test("does not treat single # as anchor link", () => {
			const mark = createMockMark({
				href: "#",
			});

			const result = getHref(mark);

			expect(result).toBe("/#");
		});
	});

	describe("when href is absolute URL", () => {
		test("returns URL as is with hash", () => {
			const mark = createMockMark({
				href: "https://example.com/page",
				hash: "#anchor",
			});

			const result = getHref(mark);

			expect(result).toBe("https://example.com/page#anchor");
		});

		test("returns URL as is without hash when hash is not provided", () => {
			const mark = createMockMark({
				href: "https://example.com/page",
			});

			const result = getHref(mark);

			expect(result).toBe("https://example.com/page");
		});

		test("handles http protocol", () => {
			const mark = createMockMark({
				href: "http://example.com",
			});

			const result = getHref(mark);

			expect(result).toBe("http://example.com");
		});
	});

	describe("when href is absolute path", () => {
		test("returns path starting with / as is with hash", () => {
			const mark = createMockMark({
				href: "/docs/page",
				hash: "#section",
			});

			const result = getHref(mark);

			expect(result).toBe("/docs/page#section");
		});

		test("returns path starting with / as is without hash", () => {
			const mark = createMockMark({
				href: "/docs/page",
			});

			const result = getHref(mark);

			expect(result).toBe("/docs/page");
		});
	});

	describe("when href is relative path", () => {
		test("prepends / to relative path with hash", () => {
			const mark = createMockMark({
				href: "docs/page",
				hash: "#section",
			});

			const result = getHref(mark);

			expect(result).toBe("/docs/page#section");
		});

		test("prepends / to relative path without hash", () => {
			const mark = createMockMark({
				href: "docs/page",
			});

			const result = getHref(mark);

			expect(result).toBe("/docs/page");
		});

		test("prepends / to single word path", () => {
			const mark = createMockMark({
				href: "page",
			});

			const result = getHref(mark);

			expect(result).toBe("/page");
		});
	});

	describe("edge cases", () => {
		test("handles missing hash attribute", () => {
			const mark = createMockMark({
				href: "/path",
			});

			const result = getHref(mark);

			expect(result).toBe("/path");
		});

		test("handles empty hash attribute", () => {
			const mark = createMockMark({
				href: "/path",
				hash: "",
			});

			const result = getHref(mark);

			expect(result).toBe("/path");
		});

		test("handles null hash attribute", () => {
			const mark = createMockMark({
				href: "/path",
				hash: null,
			});

			const result = getHref(mark);

			expect(result).toBe("/path");
		});

		test("handles undefined hash attribute", () => {
			const mark = createMockMark({
				href: "/path",
				hash: undefined,
			});

			const result = getHref(mark);

			expect(result).toBe("/path");
		});
	});
});
