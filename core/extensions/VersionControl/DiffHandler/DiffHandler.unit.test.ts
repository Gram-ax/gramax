import { FileStatus } from "../../Watchers/model/FileStatus";
import { getDiff, getLevenshteinMatching, getMatchingPercent } from "./DiffHandler";
import { DiffHunk } from "./model/DiffHunk";

describe("DiffHandler", () => {
	describe("Finds differences between two files in", () => {
		test("range of text that was deleted", () => {
			const newContent = "content";
			const oldContent = "old content";
			const output: DiffHunk[] = [
				{ type: FileStatus.delete, value: "old " },
				{ value: "content", type: undefined },
			];
			expect(getDiff(oldContent, newContent).changes).toEqual(output);
		});
		test("range of text that was added", () => {
			const newContent = "new content";
			const oldContent = "content";
			const output: DiffHunk[] = [
				{ type: FileStatus.new, value: "new " },
				{ value: "content", type: undefined },
			];
			expect(getDiff(oldContent, newContent).changes).toEqual(output);
		});
		test("ranges of text that were added and deleted", () => {
			const newContent = "n content";
			const oldContent = "old content";
			const output: DiffHunk[] = [
				{ type: FileStatus.delete, value: "old" },
				{ type: FileStatus.new, value: "n" },
				{ value: " content", type: undefined },
			];
			expect(getDiff(oldContent, newContent).changes).toEqual(output);
		});
	});
	describe("Finds matching percentage", () => {
		describe("For identical texts", () => {
			test("Without extra line breaks", () => {
				const text1 = "identical\n1\n2\n3";
				const text2 = "identical\n1\n2\n3";

				expect(getMatchingPercent(text1, text2)).toEqual(100);
			});
			test("With extra line breaks", () => {
				const text1 = "identical\n1\n2\n3";
				const text2 = "identical\n1\n2\n3\n";

				expect(getMatchingPercent(text1, text2)).not.toEqual(100);
			});
		});

		test("For completely different texts", () => {
			const text1 = "aaa\n1\n2\n3";
			const text2 = "bbb\n4\n5\n6";

			expect(getMatchingPercent(text1, text2)).toEqual(0);
		});
		test("For texts with exactly half matching content", () => {
			const text1 = "aaa\nbbb\n2\n3";
			const text2 = "aaa\nbbb\n5\n6";

			expect(getMatchingPercent(text1, text2)).toEqual(50);
		});
	});

	describe("Calculates Levenshtein distance", () => {
		test("returns 1 for identical strings", () => {
			const text1 = "identical";
			const text2 = "identical";

			expect(getLevenshteinMatching(text1, text2)).toBe(1);
		});

		test("returns 0 for completely different strings", () => {
			const text1 = "abc";
			const text2 = "xyz";

			expect(getLevenshteinMatching(text1, text2)).toBe(0);
		});

		test("handles empty strings correctly", () => {
			expect(getLevenshteinMatching("", "")).toBe(1);
			expect(getLevenshteinMatching("abc", "")).toBe(0);
			expect(getLevenshteinMatching("", "abc")).toBe(0);
		});

		test("calculates partial match correctly", () => {
			const text1 = "kitten";
			const text2 = "sitting";

			expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.571, 3);
		});

		test("handles strings of different lengths", () => {
			const text1 = "short";
			const text2 = "longer text";

			expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.18);
		});

		test("handles special characters", () => {
			const text1 = "hello\nworld";
			const text2 = "hello world";

			expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.91);
		});

		test("handles strings with space in the middle", () => {
			const text1 = "i love banana";
			const text2 = "i love bana na";

			expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.93);
		});

		test("case sensitivity", () => {
			const text1 = "Hello";
			const text2 = "hello";
			expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.8);
		});

		describe("handles cyrillic text", () => {
			test("basic cyrillic characters", () => {
				const text1 = "привет мир";
				const text2 = "привет мир!";
				expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.91);
			});

			test("mixed cyrillic and latin characters", () => {
				const text1 = "hello мир";
				const text2 = "hello мир!";
				expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.9);
			});

			test("words with similar spelling", () => {
				const text1 = "котёнок";
				const text2 = "котенок";
				expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.86);
			});

			test("different cases", () => {
				const text1 = "Привет";
				const text2 = "привет";
				expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.83);
			});

			test("spaces and punctuation", () => {
				const text1 = "Привет, как дела?";
				const text2 = "Привет как дела";
				expect(getLevenshteinMatching(text1, text2)).toBeCloseTo(0.88);
			});
		});
	});
});
