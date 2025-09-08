import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { WORD_BOOKMARK_MAX as MAX } from "@ext/wordExport/generateBookmarkName";
import { XxHash } from "@core/Hash/Hasher";

const HASH_RE = /_[a-z0-9]{5}$/;

describe("generateBookmarkName", () => {
	beforeAll(async () => await XxHash.init());
	
	test("generates bookmark with id", () => {
		const order = "1.";
		const title = "Test Title";
		const id = "test-id";

		const result = generateBookmarkName(order, title, id);

		// '1.' → '1' but prefixed with 'b_' since Word bookmarks cannot start with a digit,
		// spaces → '_', '-' removed
		expect(result).toBe("b_1_Test_Title_testid");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	test("generates bookmark without id", () => {
		const result = generateBookmarkName("2.", "Another Title");
		expect(result).toBe("b_2_Another_Title");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	test("replaces spaces with underscores and strips dashes", () => {
		const result = generateBookmarkName("3.", "Complex Title With Spaces", "test-id");
		expect(result).toBe("b_3_Complex_Title_With_Spaces_testid");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	test("works with empty order", () => {
		const result = generateBookmarkName("", "Title", "test-id");
		expect(result).toBe("Title_testid");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	test("works with empty title", () => {
		const result = generateBookmarkName("1.", "", "test-id");
		// '1.' → '1' + 'b_' prefix since it starts with digit
		expect(result).toBe("b_1_testid");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	test("works with empty order and title", () => {
		const result = generateBookmarkName("", "", "test-id");
		// only id remains, '-' removed
		expect(result).toBe("testid");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	test("supports Unicode (Cyrillic) and adds 'b_' prefix if order starts with digit", () => {
		const result = generateBookmarkName("10.", "Привет мир", "abc-123");
		expect(result).toBe("b_10_Привет_мир_abc123");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	test("adds 'b_' prefix when title starts with digit", () => {
		const result = generateBookmarkName("", "123", undefined);
		expect(result).toBe("b_123");
		expect(result.length).toBeLessThanOrEqual(MAX);
		expect(HASH_RE.test(result)).toBe(false);
	});

	describe("long titles (trimming + hash)", () => {
		test("very long title gets trimmed and hash is appended", () => {
			const longTitle = "This is a very very very very very long document title with extras";
			const result = generateBookmarkName("1.", longTitle, "section-42");

			expect(result.length).toBeLessThanOrEqual(MAX);
			expect(HASH_RE.test(result)).toBe(true);
		});

		test("extremely long title without id is also trimmed", () => {
			const longTitle = "A".repeat(60);
			const result = generateBookmarkName("1.", longTitle);

			expect(result.length).toBeLessThanOrEqual(MAX);
			expect(HASH_RE.test(result)).toBe(true);
		});

		test("different inputs result in different names (hash changes)", () => {
			const t1 = "Title ".repeat(20);
			const t2 = "Title ".repeat(19) + "X";
			const a = generateBookmarkName("1.", t1, "id");
			const b = generateBookmarkName("1.", t2, "id");

			expect(a).not.toBe(b);
			expect(a.length).toBeLessThanOrEqual(MAX);
			expect(b.length).toBeLessThanOrEqual(MAX);
			expect(HASH_RE.test(a)).toBe(true);
			expect(HASH_RE.test(b)).toBe(true);
		});

		test("deterministic: same input always produces same output", () => {
			const t = "Ultra long heading ".repeat(10);
			const a = generateBookmarkName("1.", t, "zzz");
			const b = generateBookmarkName("1.", t, "zzz");

			expect(a).toBe(b);
			expect(a.length).toBeLessThanOrEqual(MAX);
			expect(HASH_RE.test(a)).toBe(true);
		});

		test("no hash added if length is within limit", () => {
			const title = "Short but_with_underscores";
			const result = generateBookmarkName("9.", title, "x");

			expect(result.length).toBeLessThanOrEqual(MAX);
			expect(HASH_RE.test(result)).toBe(false);
		});
	});
});
