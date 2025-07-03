import { Change, diffLines } from "diff";
import { distance } from "fastest-levenshtein";
import { FileStatus } from "../../Watchers/model/FileStatus";
import DiffMatchPatch from "./diffMatchLib";
import getChanges from "./logic/DiffConverter";
import { DiffHunk } from "./model/DiffHunk";
import { VersionControlDiff } from "./model/VersionControlDiff";

export const getDiff = (
	oldContent: string,
	newContent: string,
	{ words }: { words: boolean } = { words: true },
): { changes: DiffHunk[]; added: number; removed: number } => {
	oldContent = oldContent ? oldContent.replaceAll("\n", " \n") : "";
	newContent = newContent ? newContent.replaceAll("\n", " \n") : "";
	const diff = new DiffMatchPatch();
	const diffs: VersionControlDiff[] = [];
	let d: DiffMatchPatch.Diff[];

	if (words) {
		d = diff.diff_words(oldContent, newContent);
	} else {
		d = diff.diff_main(oldContent, newContent);
		diff.diff_cleanupSemantic(d);
	}

	let content = newContent;
	d.map((dif, idx) => {
		if (dif[0]) {
			const i = d
				.slice(0, idx)
				.map((e) => e[1])
				.join("").length;
			if (dif[0] == -1) {
				content = content.slice(0, i) + dif[1] + content.slice(i);
			}
			diffs.push({
				range: {
					startIdx: i,
					endIdx: i + dif[1].length - 1,
				},
				type: dif[0] == 1 ? FileStatus.new : FileStatus.delete,
			});
		}
	});
	const changes = diff ? getChanges(content, diffs) : [];
	let added = 0;
	let removed = 0;
	changes.forEach((change) => {
		if (change.type === FileStatus.new) added++;
		else if (change.type === FileStatus.delete) removed++;
	});
	return { changes, added, removed };
};

export const getMatchingPercent = (oldText: string, newText: string): number => {
	let matchingLines = 0;
	const oldTextLines = diffLines(oldText, oldText)[0].count;
	const newTextLines = diffLines(newText, newText)[0].count;
	const maxLines = oldTextLines > newTextLines ? oldTextLines : newTextLines;

	const diffs: Change[] = diffLines(oldText, newText);

	diffs.forEach((part: Change) => {
		if (!part.added && !part.removed) {
			if (part.count) matchingLines += part.count;
		}
	});

	return (matchingLines / maxLines) * 100;
};

export const getLevenshteinMatching = (oldText: string, newText: string): number => {
	if (oldText === newText) return 1;
	return 1 - distance(oldText, newText) / Math.max(oldText.length, newText.length);
};
