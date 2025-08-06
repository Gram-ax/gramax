export default class PositionMapper {
	private _deletedIdxes: number[];
	private _addedIdxes: number[];

	constructor(deletedIdxes: number[], addedIdxes: number[]) {
		this._deletedIdxes = deletedIdxes.toSorted((a, b) => a - b);
		this._addedIdxes = addedIdxes.toSorted((a, b) => a - b);
	}

	mapOldToNew(oldPos: number): number {
		let finalPos = oldPos;

		const smallerDeletedIdxes = this._deletedIdxes.filter((idx) => idx < oldPos);
		finalPos -= smallerDeletedIdxes.length;

		this._addedIdxes.forEach((addedIdx) => {
			if (addedIdx >= finalPos) return;
			finalPos++;
		});

		return finalPos;
	}
}
