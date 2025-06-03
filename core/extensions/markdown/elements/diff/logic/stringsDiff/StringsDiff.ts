import FindMatrixCrossMax from "@ext/markdown/elements/diff/logic/stringsDiff/FindMatrixCrossMax";
import { getDiff } from "@ext/VersionControl/DiffHandler/DiffHandler";
import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import { compareTwoStrings } from "string-similarity";

const DEFAULT_SIMILARITY_THRESHOLD = 0.5;

export interface StringsDiffConfig {
	similarityThreshold?: number;
	canStringsBeCompared?: (oldString: string, newString: string) => boolean;
}

export default class StringsDiff {
	private readonly _similarityThreshold: number;

	private _oldStrings: string[];
	private _newStrings: string[];
	private _canStringsBeCompared: (oldString: string, newString: string) => boolean;

	constructor(oldStrings: string[], newStrings: string[], config?: StringsDiffConfig) {
		this._oldStrings = oldStrings;
		this._newStrings = newStrings;
		this._similarityThreshold = config?.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
		this._canStringsBeCompared = config?.canStringsBeCompared ?? this._defaultCanStringsBeCompared;
	}

	getDiff(): {
		deletedIdxes: number[];
		addedIdxes: number[];
		modified: { oldIdx: number; newIdx: number; diff: DiffHunk[] }[];
	} {
		const similarityMatrix: number[][] = this._getEmptySimilarityMatrix();

		this._oldStrings.forEach((oldString, oldIdx) => {
			this._newStrings.forEach((newString, newIdx) => {
				const similarPercent = this._getSimilarPercent(oldString, newString);
				similarityMatrix[oldIdx][newIdx] = similarPercent > this._similarityThreshold ? similarPercent : 0;
			});
		});

		const similarities = new FindMatrixCrossMax(similarityMatrix).findCrossMaxes();
		const oldSimilarites = similarities.map((similarity) => similarity[0]);
		const newSimilarites = similarities.map((similarity) => similarity[1]);

		const deletedIdxes: number[] = this._oldStrings
			.map((_, oldIdx) => (oldSimilarites.includes(oldIdx) ? null : oldIdx))
			.filter((x) => x != null);

		const addedIdxes: number[] = this._newStrings
			.map((_, newIdx) => (newSimilarites.includes(newIdx) ? null : newIdx))
			.filter((x) => x != null);

		const modified: { oldIdx: number; newIdx: number; diff: DiffHunk[] }[] = similarities
			.map(([oldIdx, newIdx]) => {
				if (similarityMatrix[oldIdx][newIdx] === 1) return null;
				const oldString = this._oldStrings[oldIdx];
				const newString = this._newStrings[newIdx];
				const diff = this._getStringsDiff(oldString, newString);
				return { oldIdx, newIdx, diff };
			})
			.filter(Boolean);

		return { deletedIdxes, addedIdxes, modified };
	}

	private _getEmptySimilarityMatrix(): number[][] {
		return Array.from({ length: this._oldStrings.length }, () => Array(this._newStrings.length).fill(0));
	}

	private _defaultCanStringsBeCompared(oldString: string, newString: string) {
		if (oldString === newString) return true;
		const MIN_WORDS_LENGTH = 1;
		return oldString.split(" ").length > MIN_WORDS_LENGTH && newString.split(" ").length > MIN_WORDS_LENGTH;
	}

	private _getStringsDiff(oldContent: string, newContent: string) {
		return getDiff(oldContent, newContent).changes;
	}

	private _getSimilarPercent(oldContent: string, newContent: string) {
		if (!this._canStringsBeCompared(oldContent, newContent)) return 0;

		const similarityPercent = compareTwoStrings(oldContent, newContent);
		return this._fixSimilarityPercent(similarityPercent, oldContent, newContent);
	}

	private _fixSimilarityPercent(similarityPercent: number, oldContent: string, newContent: string): number {
		if (!(similarityPercent === 1 && oldContent !== newContent)) return similarityPercent;

		// For some reason, "compareTwoStrings" returns 1 for "banana" and "ba nana",
		// so we need to calculate how many characters they differ and subtract that percentage from 1.
		const delta = Math.abs(oldContent.length - newContent.length);
		const maxLength = Math.max(oldContent.length, newContent.length);
		const fixedSimilarityPercent = 1 - delta / maxLength;

		return fixedSimilarityPercent;
	}
}
