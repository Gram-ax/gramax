import { LevenshteinStrings } from "./LevenshteinStrings";

describe("LevenshteinStrings", () => {
	test("should return empty arrays for identical string arrays", () => {
		const oldStrings = ["line1", "line2", "line3"];
		const newStrings = ["line1", "line2", "line3"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [], addedIndices: [] });
	});

	test("should detect added lines", () => {
		const oldStrings = ["line1", "line3"];
		const newStrings = ["line1", "line2", "line3"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [], addedIndices: [1] });
	});

	test("should detect removed lines", () => {
		const oldStrings = ["line1", "line2", "line3"];
		const newStrings = ["line1", "line3"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [1], addedIndices: [] });
	});

	test("should detect replaced lines", () => {
		const oldStrings = ["line1", "old line", "line3"];
		const newStrings = ["line1", "new line", "line3"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [1], addedIndices: [1] });
	});

	test("should handle empty arrays", () => {
		const oldStrings: string[] = [];
		const newStrings: string[] = [];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [], addedIndices: [] });
	});

	test("should handle completely different arrays", () => {
		const oldStrings = ["old1", "old2"];
		const newStrings = ["new1", "new2"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [0, 1], addedIndices: [0, 1] });
	});

	test("should handle multiple changes in sequence", () => {
		const oldStrings = ["line1", "line2", "line3", "line4"];
		const newStrings = ["line1", "new2", "new3", "line4"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [1, 2], addedIndices: [1, 2] });
	});

	test("should handle empty old array", () => {
		const oldStrings: string[] = [];
		const newStrings = ["line1", "line2", "line3"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [], addedIndices: [0, 1, 2] });
	});

	test("should handle empty new array", () => {
		const oldStrings = ["line1", "line2", "line3"];
		const newStrings: string[] = [];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [0, 1, 2], addedIndices: [] });
	});

	test("should handle much longer new array", () => {
		const oldStrings = ["line1"];
		const newStrings = ["line1", "line2", "line3", "line4", "line5"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [], addedIndices: [1, 2, 3, 4] });
	});

	test("should handle much longer old array", () => {
		const oldStrings = ["line1", "line2", "line3", "line4", "line5"];
		const newStrings = ["line1"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [1, 2, 3, 4], addedIndices: [] });
	});

	test("should handle arrays with different content and length", () => {
		const oldStrings = ["line1", "line2", "line3"];
		const newStrings = ["new1", "new2", "new3", "new4", "new5"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [0, 1, 2], addedIndices: [0, 1, 2, 3, 4] });
	});

	test("should handle arrays with partially matching strings", () => {
		const oldStrings = ["line1", "line2", "line3", "line4", "line5"];
		const newStrings = ["line1", "new2", "line3", "new4", "line5", "new6", "new7"];

		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();

		expect(diff).toEqual({ removedIndices: [1, 3], addedIndices: [1, 3, 5, 6] });
	});

	test("should handle large arrays", () => {
		const oldStrings = Array.from({ length: 1000 }, (_, i) => `line${i}`);
		const newStrings = Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? `line${i}` : `new${i}`));

		const startTime = performance.now();
		const diff = new LevenshteinStrings(oldStrings, newStrings).getDiff();
		const endTime = performance.now();

		const executionTime = endTime - startTime;

		expect(diff.removedIndices).toHaveLength(500);
		expect(diff.addedIndices).toHaveLength(500);
		expect(executionTime).toBeLessThan(1000);
	});
});
