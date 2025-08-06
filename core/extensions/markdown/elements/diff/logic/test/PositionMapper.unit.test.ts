import PositionMapper from "@ext/markdown/elements/diff/logic/PositionMapper";

describe("PositionMapper", () => {
	describe("mapOldToNew", () => {
		describe("with deletions only", () => {
			it("should return same position when no deletions before the position", () => {
				const mapper = new PositionMapper([5, 7], []);
				expect(mapper.mapOldToNew(3)).toBe(3);
			});

			it("should decrease position by number of deletions before it", () => {
				const mapper = new PositionMapper([2, 5, 8], []);
				expect(mapper.mapOldToNew(6)).toBe(4);
			});

			it("should handle position at deleted index", () => {
				const mapper = new PositionMapper([3, 7], []);
				expect(mapper.mapOldToNew(3)).toBe(3);
			});

			it("should handle position after all deletions", () => {
				const mapper = new PositionMapper([1, 3], []);
				expect(mapper.mapOldToNew(10)).toBe(8);
			});
		});

		describe("with additions only", () => {
			it("should return same position when no additions before the position", () => {
				const mapper = new PositionMapper([], [5, 7]);
				expect(mapper.mapOldToNew(3)).toBe(3);
			});

			it("should increase position by number of additions before it", () => {
				const mapper = new PositionMapper([], [2, 5, 8]);
				expect(mapper.mapOldToNew(6)).toBe(8);
			});

			it("should handle position at added index", () => {
				const mapper = new PositionMapper([], [3, 7]);
				expect(mapper.mapOldToNew(3)).toBe(3);
			});

			it("should handle position after all additions", () => {
				const mapper = new PositionMapper([], [1, 3]);
				expect(mapper.mapOldToNew(10)).toBe(12);
			});
		});

		describe("with both deletions and additions", () => {
			it("should handle deletions and additions correctly", () => {
				const mapper = new PositionMapper([2, 5], [1, 4, 9]);
				expect(mapper.mapOldToNew(6)).toBe(6);
			});

			it("should handle complex scenario with multiple changes", () => {
				const mapper = new PositionMapper([1, 3, 7], [2, 4, 6]);
				expect(mapper.mapOldToNew(8)).toBe(8);
			});

			it("should handle position zero", () => {
				const mapper = new PositionMapper([2, 4], [1, 3]);
				expect(mapper.mapOldToNew(0)).toBe(0);
			});

			it("should handle position before any changes", () => {
				const mapper = new PositionMapper([5, 8], [3, 7]);
				expect(mapper.mapOldToNew(2)).toBe(2);
			});
		});

		describe("edge cases", () => {
			it("should handle empty mapper", () => {
				const mapper = new PositionMapper([], []);
				expect(mapper.mapOldToNew(5)).toBe(5);
			});

			it("should handle very large position", () => {
				const mapper = new PositionMapper([10, 20, 30], [5, 15, 25, 90]);
				expect(mapper.mapOldToNew(100)).toBe(101); 
			});
		});
	});
});
