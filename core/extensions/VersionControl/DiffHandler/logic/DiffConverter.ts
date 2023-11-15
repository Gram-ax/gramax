import { Change } from "../model/Change";
import { VersionControlDiff } from "../model/VersionControlDiff";
import { VersionControlRange } from "../model/VersionControlRange";

const getChanges = (content: string, diffs: VersionControlDiff[]): Change[] => {
	const ranges = splitRanges(diffs.map((diff) => diff.range));
	return createChanges(content, ranges, diffs);
};

const splitRanges = (ranges: VersionControlRange[]): VersionControlRange[] => {
	if (!ranges.length) return [];
	const splitRanges = [];
	let startIdx = 0,
		endIdx = -1;
	while (endIdx !== Number.MAX_SAFE_INTEGER) {
		startIdx = endIdx + 1;
		endIdx = Number.MAX_SAFE_INTEGER;
		ranges.forEach((range) => {
			if (range.endIdx === range.startIdx && startIdx <= range.endIdx && range.endIdx <= endIdx)
				endIdx = range.endIdx;
			if (range.startIdx <= endIdx && startIdx < range.startIdx) endIdx = range.startIdx - 1;
			if (range.endIdx <= endIdx && startIdx < range.endIdx) endIdx = range.endIdx;
		});
		splitRanges.push({ startIdx: startIdx, endIdx: endIdx });
	}
	splitRanges.pop();
	splitRanges.push({ startIdx: startIdx });
	return splitRanges;
};

const createChanges = (content: string, ranges: VersionControlRange[], diffs: VersionControlDiff[]): Change[] => {
	if (!ranges.length) return [{ value: content }];

	let setDiffIdx: number;
	const changes: Change[] = [];
	const setCommentIdxes: number[] = [];

	ranges.forEach((range, idx) => {
		setDiffIdx = diffs.findIndex(
			(diff) => range.startIdx >= diff.range.startIdx && range.endIdx <= diff.range.endIdx,
		);
		changes.push({
			value:
				ranges.length !== idx + 1
					? content.slice(range.startIdx, range.endIdx + 1)
					: content.slice(range.startIdx),
			type: setDiffIdx !== -1 ? diffs[setDiffIdx].type : undefined,
		});
		setCommentIdxes.length = 0;
	});
	return changes;
};

export default getChanges;
