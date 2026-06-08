import FindMatrixCrossMax from "./FindMatrixCrossMax";

describe("FindMatrixCrossMax handles", () => {
	test("cross maximums in matrix", () => {
		const matrix = [
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9],
		];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes().toSorted();

		expect(result).toEqual([
			[0, 0],
			[1, 1],
			[2, 2],
		]);
	});

	test("find multiple maximums in matrix with empty cells", () => {
		const matrix = [
			[1, 0, 3],
			[0, 5, 0],
			[7, 0, 9],
		];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes().toSorted();

		expect(result).toEqual([
			[0, 0],
			[1, 1],
			[2, 2],
		]);
	});

	test("empty matrix", () => {
		const matrix: number[][] = [];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes().toSorted();

		expect(result).toEqual([]);
	});

	test("matrix with all zeros", () => {
		const matrix = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0],
		];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes().toSorted();

		expect(result).toEqual([]);
	});

	test("matrix with equal values", () => {
		const matrix = [
			[1, 1, 1],
			[1, 1, 1],
			[1, 1, 1],
		];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes().toSorted();

		expect(result).toEqual([
			[0, 0],
			[1, 1],
			[2, 2],
		]);
	});

	test("matrix with single row", () => {
		const matrix = [[1, 2, 3, 4, 5]];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes().toSorted();

		expect(result).toEqual([[0, 4]]);
	});

	test("matrix with single column", () => {
		const matrix = [[1], [2], [3], [4], [5]];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes();

		expect(result).toEqual([[4, 0]]);
	});

	test("matrix with not equal size", () => {
		const matrix = [
			[12, 70, 33, 51, 89, 45],
			[67, 23, 96, 18, 55, 91],
			[34, 78, 15, 62, 54, 29],
			[77, 99, 41, 83, 84, 37],
			[26, 59, 72, 44, 95, 63],
		];
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes().toSorted();

		expect(result).toEqual([
			[0, 5],
			[1, 2],
			[2, 3],
			[3, 1],
			[4, 4],
		]);
	});

	test("very large matrix", () => {
		let counter = 0;
		const matrix = Array.from({ length: 1000 }, () => Array.from({ length: 1000 }, () => ++counter));
		const startTime = performance.now();
		const finder = new FindMatrixCrossMax(matrix);

		const result = finder.findCrossMaxes();

		const duration = performance.now() - startTime;
		expect(result).toHaveLength(1000);
		expect(duration).toBeLessThan(1000);
	});
});
