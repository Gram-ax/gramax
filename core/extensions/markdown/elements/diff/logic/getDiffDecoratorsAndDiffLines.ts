import AstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/AstDiffTransofrmer";
import getAddedAndDeletedPartIdxes from "@ext/markdown/elements/diff/logic/getAddedAndDeletedPartIdxes";
import LevenshteinStringsDiff, {
	LevenshteinStringsDiffConfig,
} from "@ext/markdown/elements/diff/logic/levenshteinStrings/LevenshteinStringsDiff";
import { DiffLine, Pos } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { Decoration } from "@tiptap/pm/view";

const getDiffDecoratorsAndDiffLines = (
	astDiffTransformer: AstDiffTransformer,
	config?: LevenshteinStringsDiffConfig,
) => {
	const addedDecorations: Decoration[] = [];
	const removedDecorations: Decoration[] = [];
	const diffLines: DiffLine[] = [];

	const { oldStrings, newStrings } = astDiffTransformer.getStrings();

	const diff = new LevenshteinStringsDiff(oldStrings, newStrings, config).getDiff();

	diff.addedIdxes.forEach((idx) => {
		if (newStrings[idx] === "") {
			const addedBlockStartAndEnd = astDiffTransformer.getAstPos("new", idx, 0);
			diffLines.push({
				type: "added",
				pos: { from: addedBlockStartAndEnd, to: addedBlockStartAndEnd },
			});
			return;
		}

		const addedBlockStart = astDiffTransformer.getAstPos("new", idx, 0);
		const addedBlockEnd = astDiffTransformer.getAstPos("new", idx, newStrings[idx].length - 1);

		diffLines.push({
			type: "added",
			pos: { from: addedBlockStart, to: addedBlockEnd },
		});
	});

	diff.deletedIdxes.forEach((idx) => {
		if (oldStrings[idx] === "") {
			const deletedBlockStartAndEnd = astDiffTransformer.getAstPos("old", idx, 0);
			diffLines.push({
				type: "deleted",
				pos: { from: deletedBlockStartAndEnd, to: deletedBlockStartAndEnd },
			});
			return;
		}

		const deletedBlockStart = astDiffTransformer.getAstPos("old", idx, 0);
		const deletedBlockEnd = astDiffTransformer.getAstPos("old", idx, oldStrings[idx].length - 1);

		diffLines.push({
			type: "deleted",
			pos: { from: deletedBlockStart, to: deletedBlockEnd },
		});
	});

	diff.modified.forEach(({ oldIdx, newIdx, diff }) => {
		const newAstModifiedBlockStart = astDiffTransformer.getAstPos("new", newIdx, 0);
		const newAstModifiedBlockEnd = astDiffTransformer.getAstPos("new", newIdx, newStrings[newIdx].length - 1);

		const oldAstModifiedBlockStart = astDiffTransformer.getAstPos("old", oldIdx, 0);
		const oldAstModifiedBlockEnd = astDiffTransformer.getAstPos("old", oldIdx, oldStrings[oldIdx].length - 1);

		const inlineAddedPartPositions: Pos[] = [];
		const inlineDeletedPartPositions: Pos[] = [];

		const { addedParts: inlineAddedParts, deletedParts: inlineDeletedParts } = getAddedAndDeletedPartIdxes(diff);

		inlineAddedParts.forEach(([from, to]) => {
			const inlineAddedPosFrom = astDiffTransformer.getAstPos("new", newIdx, from);
			const inlineAddedPosTo = astDiffTransformer.getAstPos("new", newIdx, to);

			inlineAddedPartPositions.push({ from: inlineAddedPosFrom, to: inlineAddedPosTo });
			addedDecorations.push(Decoration.inline(inlineAddedPosFrom, inlineAddedPosTo + 1, { class: "added-text" })); // +1 to include the last character
		});

		inlineDeletedParts.forEach(([from, to]) => {
			const inlineDeletedPosStart = astDiffTransformer.getAstPos("old", oldIdx, from);
			const inlineDeletedPosEnd = astDiffTransformer.getAstPos("old", oldIdx, to);

			inlineDeletedPartPositions.push({ from: inlineDeletedPosStart, to: inlineDeletedPosEnd });
			removedDecorations.push(
				Decoration.inline(inlineDeletedPosStart, inlineDeletedPosEnd + 1, { class: "deleted-text" }), // +1 to include the last character
			);
		});

		diffLines.push({
			type: "modified",
			pos: { from: newAstModifiedBlockStart, to: newAstModifiedBlockEnd },
			oldPos: { from: oldAstModifiedBlockStart, to: oldAstModifiedBlockEnd },
			diff: {
				hunks: diff,
				addedPartPositions: inlineAddedPartPositions,
				deletedPartPositions: inlineDeletedPartPositions,
			},
		});
	});

	return {
		addedDecorations,
		removedDecorations,
		changedContextDecorations: [],
		diffLines,
	};
};

export default getDiffDecoratorsAndDiffLines;
