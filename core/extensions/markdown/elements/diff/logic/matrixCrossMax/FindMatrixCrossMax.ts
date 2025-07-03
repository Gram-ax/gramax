export default class FindMatrixCrossMax {
	private readonly _matrix: number[][] = [];
	private _width = 0;
	private _height = 0;

	constructor(matrix: number[][]) {
		this._fillNewMatrix(matrix);
		this._width = matrix[0]?.length ?? 0;
		this._height = matrix.length;
	}

	findCrossMaxes(): [number, number][] {
		if (!this._width || !this._height) return [];

		const maxes: [number, number][] = [];
		const sortedIndices = this._sortIndicesByMaxValue(this._matrix);

		for (let idx = 0; idx < sortedIndices.length; idx++) {
			const [i, j] = sortedIndices[idx];
			if (!this._matrix[i][j]) continue;
			this._walkInCross(i, j, (_, crossI, crossJ) => (this._matrix[crossI][crossJ] = 0));
			maxes.push([i, j]);
		}

		return maxes;
	}

	private _walkLeft(i: number, j: number, callback: (value: number, idx: number) => void) {
		const row = this._matrix[i];
		for (let leftIdx = 0; leftIdx < j; leftIdx++) {
			callback(row[leftIdx], leftIdx);
		}
	}

	private _walkRight(i: number, j: number, callback: (value: number, idx: number) => void) {
		const row = this._matrix[i];
		for (let rightIdx = j + 1; rightIdx < this._width; rightIdx++) {
			callback(row[rightIdx], rightIdx);
		}
	}

	private _walkTop(i: number, j: number, callback: (value: number, idx: number) => void) {
		for (let topIdx = 0; topIdx < i; topIdx++) {
			callback(this._matrix[topIdx][j], topIdx);
		}
	}

	private _walkBottom(i: number, j: number, callback: (value: number, idx: number) => void) {
		for (let bottomIdx = i + 1; bottomIdx < this._height; bottomIdx++) {
			callback(this._matrix[bottomIdx][j], bottomIdx);
		}
	}

	private _walkInCross(i: number, j: number, callback: (value: number, i: number, j: number) => void) {
		this._walkLeft(i, j, (value, idx) => callback(value, i, idx));
		this._walkRight(i, j, (value, idx) => callback(value, i, idx));
		this._walkTop(i, j, (value, idx) => callback(value, idx, j));
		this._walkBottom(i, j, (value, idx) => callback(value, idx, j));
	}

	private _fillNewMatrix(matrix: number[][]) {
		for (let i = 0; i < matrix.length; i++) {
			this._matrix[i] = [];
			for (let j = 0; j < matrix[i].length; j++) {
				this._matrix[i][j] = matrix[i][j];
			}
		}
	}

	private _sortIndicesByMaxValue(matrix: number[][]): [number, number][] {
		const indices: [number, number][] = [];

		for (let i = 0; i < matrix.length; i++) {
			for (let j = 0; j < matrix[i].length; j++) {
				indices.push([i, j]);
			}
		}

		indices.sort((a, b) => {
			const [i1, j1] = a;
			const [i2, j2] = b;
			return matrix[i2][j2] - matrix[i1][j1];
		});

		return indices;
	}
}
