import { LevenshteinStrings } from "@ext/markdown/elements/diff/logic/levenshteinStrings/LevenshteinStrings";
import FindMatrixCrossMax from "@ext/markdown/elements/diff/logic/matrixCrossMax/FindMatrixCrossMax";
import { getDiff, getLevenshteinMatching } from "@ext/VersionControl/DiffHandler/DiffHandler";
import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";

const DEFAULT_SIMILARITY_THRESHOLD = 0.5;

export interface LevenshteinStringsDiffConfig {
	similarityThreshold?: number;
	canStringsBeCompared?: (oldString: string, newString: string) => boolean;
}

export type LevenshteinStringsDiffResult = {
	deletedIdxes: number[];
	addedIdxes: number[];
	modified: { oldIdx: number; newIdx: number; diff: DiffHunk[] }[];
};

export default class LevenshteinStringsDiff {
	private readonly _similarityThreshold: number;

	private _oldStrings: string[];
	private _newStrings: string[];
	private _canStringsBeCompared: (oldString: string, newString: string) => boolean;

	constructor(oldStrings: string[], newStrings: string[], config?: LevenshteinStringsDiffConfig) {
		this._oldStrings = oldStrings;
		this._newStrings = newStrings;
		this._similarityThreshold = config?.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
		this._canStringsBeCompared = config?.canStringsBeCompared ?? this._defaultCanStringsBeCompared;
	}

	getDiff(): LevenshteinStringsDiffResult {
		const similarityMatrix: number[][] = this._getEmptySimilarityMatrix();

		const { addedIndices, removedIndices } = new LevenshteinStrings(this._oldStrings, this._newStrings).getDiff();

		addedIndices.forEach((newIdx) => {
			removedIndices.forEach((oldIdx) => {
				const oldString = this._oldStrings[oldIdx];
				const newString = this._newStrings[newIdx];
				const similarPercent = this._getSimilarPercent(oldString, newString);
				similarityMatrix[oldIdx][newIdx] = similarPercent > this._similarityThreshold ? similarPercent : 0;
			});
		});

		const similarities = new FindMatrixCrossMax(similarityMatrix).findCrossMaxes();

		const oldSimilarities = similarities.map((similarity) => similarity[0]);
		const newSimilarities = similarities.map((similarity) => similarity[1]);

		const modified = similarities
			.map(([oldIdx, newIdx]) => {
				const similarityPercent = similarityMatrix[oldIdx][newIdx];
				if (similarityPercent === 1 || similarityPercent === 0) return null;

				const oldString = this._oldStrings[oldIdx];
				const newString = this._newStrings[newIdx];
				const diff = this._getStringsDiff(oldString, newString);
				return { oldIdx, newIdx, diff };
			})
			.filter(Boolean);

		const deletedIdxes = removedIndices.filter((idx) => !oldSimilarities.includes(idx));
		const addedIdxes = addedIndices.filter((idx) => !newSimilarities.includes(idx));

		return { deletedIdxes, addedIdxes, modified };
	}

	private _getEmptySimilarityMatrix(): number[][] {
		return Array.from({ length: this._oldStrings.length }, () => Array(this._newStrings.length).fill(0));
	}

	private _defaultCanStringsBeCompared(oldString: string, newString: string) {
		if (oldString === "" || newString === "") return false;
		if (oldString === newString) return true;
		const MIN_WORDS_LENGTH = 1;
		return oldString.split(" ").length > MIN_WORDS_LENGTH && newString.split(" ").length > MIN_WORDS_LENGTH;
	}

	private _getStringsDiff(oldContent: string, newContent: string) {
		return getDiff(oldContent, newContent).changes;
	}

	private _getSimilarPercent(oldContent: string, newContent: string) {
		if (!this._canStringsBeCompared(oldContent, newContent)) return 0;

		return getLevenshteinMatching(oldContent, newContent);
	}
}
