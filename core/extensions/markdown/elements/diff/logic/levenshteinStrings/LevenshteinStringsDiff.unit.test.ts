import LevenshteinStringsDiff from "./LevenshteinStringsDiff";

const createDiff = (oldStrings: string[], newStrings: string[], config?: { similarityThreshold?: number }) => {
	return new LevenshteinStringsDiff(oldStrings, newStrings, {
		...config,
		canStringsBeCompared: (oldString, newString) => oldString.length > 1 && newString.length > 1,
	});
};

describe("LevenshteinStringsDiff", () => {
	describe("Basic cases", () => {
		test("should return empty arrays for identical strings", () => {
			const oldStrings = ["line1", "line2", "line3"];
			const newStrings = ["line1", "line2", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [],
				addedIdxes: [],
				modified: [],
			});
		});

		test("should handle empty arrays", () => {
			const oldStrings: string[] = [];
			const newStrings: string[] = [];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [],
				addedIdxes: [],
				modified: [],
			});
		});
	});

	describe("Simple operations", () => {
		test("should detect added lines", () => {
			const oldStrings = ["line1", "line3"];
			const newStrings = ["line1", "line2", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [],
				addedIdxes: [1],
				modified: [],
			});
		});

		test("should detect removed lines", () => {
			const oldStrings = ["line1", "line2", "line3"];
			const newStrings = ["line1", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [1],
				addedIdxes: [],
				modified: [],
			});
		});

		test("should handle completely different arrays", () => {
			const oldStrings = ["old1", "old2"];
			const newStrings = ["new1", "new2"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [0, 1],
				addedIdxes: [0, 1],
				modified: [],
			});
		});
	});

	describe("String modifications", () => {
		test("should detect modified lines with high similarity", () => {
			const oldStrings = ["This is a test line", "line2", "line3"];
			const newStrings = ["This is a modified test line", "line2", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result.deletedIdxes).toEqual([]);
			expect(result.addedIdxes).toEqual([]);
			expect(result.modified).toHaveLength(1);
			expect(result.modified[0].oldIdx).toBe(0);
			expect(result.modified[0].newIdx).toBe(0);
			expect(result.modified[0].diff).toBeDefined();
		});

		test("should detect modified strings at different positions", () => {
			const oldStrings = ["line1", "This is a test", "line3", "line4"];
			const newStrings = ["line1", "line3", "This is a modified test", "line4"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result.modified).toHaveLength(1);
			expect(result.modified[0].oldIdx).toBe(1);
			expect(result.modified[0].newIdx).toBe(2);
		});
	});

	describe("Special cases", () => {
		test("should handle similar strings with spaces", () => {
			const oldStrings = ["banana"];
			const newStrings = ["ba nana"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result.modified).toHaveLength(1);
			expect(result.modified[0].oldIdx).toBe(0);
			expect(result.modified[0].newIdx).toBe(0);
		});

		test("should handle empty strings in arrays", () => {
			const oldStrings = ["line1", "", "line3"];
			const newStrings = ["line1", "", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [],
				addedIdxes: [],
				modified: [],
			});
		});

		test("should detect added empty strings", () => {
			const oldStrings = ["line1", "line3"];
			const newStrings = ["line1", "", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [],
				addedIdxes: [1],
				modified: [],
			});
		});

		test("should detect removed empty strings", () => {
			const oldStrings = ["line1", "", "line3"];
			const newStrings = ["line1", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [1],
				addedIdxes: [],
				modified: [],
			});
		});

		test("should handle arrays with only empty strings", () => {
			const oldStrings = ["", ""];
			const newStrings = ["", ""];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result).toEqual({
				deletedIdxes: [],
				addedIdxes: [],
				modified: [],
			});
		});
	});

	describe("Complex scenarios", () => {
		test("should handle multiple similar strings at different positions", () => {
			const oldStrings = ["First test line", "line2", "Second test line", "line4"];
			const newStrings = ["line2", "First modified test", "line4", "Second test modified"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result.deletedIdxes).toEqual([0]);
			expect(result.addedIdxes).toEqual([1]);
			expect(result.modified).toHaveLength(1);
			expect(result.modified[0].oldIdx).toBe(2);
			expect(result.modified[0].newIdx).toBe(3);
		});

		test("should handle reordered similar strings with additions", () => {
			const oldStrings = ["First test", "Second test", "Third test"];
			const newStrings = ["Second modified test", "new line", "First modified test", "Third modified test"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result.modified).toHaveLength(3);
			expect(result.addedIdxes).toContain(1);
			expect(result.modified.some((m) => m.oldIdx === 0 && m.newIdx === 2)).toBe(true);
			expect(result.modified.some((m) => m.oldIdx === 1 && m.newIdx === 0)).toBe(true);
			expect(result.modified.some((m) => m.oldIdx === 2 && m.newIdx === 3)).toBe(true);
		});

		test("should handle mixed empty and non-empty strings", () => {
			const oldStrings = ["", "line2", ""];
			const newStrings = ["line1", "", "line3"];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result.deletedIdxes).toEqual([0]);
			expect(result.addedIdxes).toEqual([2]);
			expect(result.modified).toHaveLength(1);
			expect(result.modified[0].oldIdx).toBe(1);
			expect(result.modified[0].newIdx).toBe(0);
		});

		test("should handle moved empty strings", () => {
			const oldStrings = ["line1", "", "line2", "line3"];
			const newStrings = ["line1", "line2", "line3", ""];

			const result = createDiff(oldStrings, newStrings).getDiff();

			expect(result.deletedIdxes).toEqual([1]);
			expect(result.addedIdxes).toEqual([3]);
		});
	});
});
