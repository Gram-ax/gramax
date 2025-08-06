import AstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/AstDiffTransofrmer";
import LevenshteinStringsDiff, {
	LevenshteinStringsDiffConfig,
} from "@ext/markdown/elements/diff/logic/levenshteinStrings/LevenshteinStringsDiff";
import {
	AddedDiffLine,
	DeletedDiffLine,
	DiffLine,
	ModifiedDiffLine,
	Pos,
} from "@ext/markdown/elements/diff/logic/model/DiffLine";
import PositionMapper from "@ext/markdown/elements/diff/logic/PositionMapper";
import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import { Decoration } from "prosemirror-view";

export type DiffRenderData = {
	addedDecorations: Decoration[];
	removedDecorations: Decoration[];
	changedContextDecorations: Decoration[];
	diffLines: DiffLine[];
};

export default class DiffRenderDataHandler {
	constructor(private _astDiffTransformer: AstDiffTransformer, private _config?: LevenshteinStringsDiffConfig) {}

	getDiffRenderData() {
		const addedDecorations: Decoration[] = [];
		const removedDecorations: Decoration[] = [];
		const diffLines: DiffLine[] = [];

		const { oldStrings, newStrings } = this._astDiffTransformer.getStrings();

		const diff = new LevenshteinStringsDiff(oldStrings, newStrings, this._config).getDiff();
		const positionMapper = new PositionMapper(diff.deletedIdxes, diff.addedIdxes);

		diff.addedIdxes.forEach((idx) => {
			if (newStrings[idx] === "") {
				const addedBlockStartAndEnd = this._astDiffTransformer.getAstPos("new", idx, 0);
				const diffLine: AddedDiffLine = {
					type: "added",
					pos: { from: addedBlockStartAndEnd, to: addedBlockStartAndEnd },
				};
				diffLines.push(diffLine);
				return;
			}

			const addedBlockStart = this._astDiffTransformer.getAstPos("new", idx, 0);
			const addedBlockEnd = this._astDiffTransformer.getAstPos("new", idx, newStrings[idx].length - 1);

			const diffLine: AddedDiffLine = {
				type: "added",
				pos: { from: addedBlockStart, to: addedBlockEnd },
			};
			diffLines.push(diffLine);
		});

		diff.deletedIdxes.forEach((idx) => {
			const posInNewAst = positionMapper.mapOldToNew(idx);
			const prevNewParagraphIdx = posInNewAst > 0 ? posInNewAst - 1 : 0; // -1 to get prev paragraph
			const prevNewParagraphContent = newStrings[prevNewParagraphIdx];
			const prevNewParagraphPos = prevNewParagraphContent === "" ? 0 : prevNewParagraphContent.length - 1;

			if (oldStrings[idx] === "") {
				const deletedBlockStartAndEnd = this._astDiffTransformer.getAstPos("old", idx, 0);
				const insertAfter = this._astDiffTransformer.getAstPos("new", prevNewParagraphIdx, prevNewParagraphPos);

				const diffLine: DeletedDiffLine = {
					type: "deleted",
					pos: { from: deletedBlockStartAndEnd, to: deletedBlockStartAndEnd },
					insertAfter,
				};
				diffLines.push(diffLine);
				return;
			}

			const deletedBlockStart = this._astDiffTransformer.getAstPos("old", idx, 0);
			const deletedBlockEnd = this._astDiffTransformer.getAstPos("old", idx, oldStrings[idx].length - 1);

			const insertAfter = this._astDiffTransformer.getAstPos("new", prevNewParagraphIdx, prevNewParagraphPos);

			const diffLine: DeletedDiffLine = {
				type: "deleted",
				pos: { from: deletedBlockStart, to: deletedBlockEnd },
				insertAfter,
			};
			diffLines.push(diffLine);
		});

		diff.modified.forEach(({ oldIdx, newIdx, diff }) => {
			const newAstModifiedBlockStart = this._astDiffTransformer.getAstPos("new", newIdx, 0);
			const newAstModifiedBlockEnd = this._astDiffTransformer.getAstPos(
				"new",
				newIdx,
				newStrings[newIdx].length - 1,
			);

			const oldAstModifiedBlockStart = this._astDiffTransformer.getAstPos("old", oldIdx, 0);
			const oldAstModifiedBlockEnd = this._astDiffTransformer.getAstPos(
				"old",
				oldIdx,
				oldStrings[oldIdx].length - 1,
			);

			const inlineAddedPartPositions: Pos[] = [];
			const inlineDeletedPartPositions: Pos[] = [];

			const { addedParts: inlineAddedParts, deletedParts: inlineDeletedParts } =
				this._getAddedAndDeletedPartIdxes(diff);

			inlineAddedParts.forEach(([from, to]) => {
				const inlineAddedPosFrom = this._astDiffTransformer.getAstPos("new", newIdx, from);
				const inlineAddedPosTo = this._astDiffTransformer.getAstPos("new", newIdx, to);

				inlineAddedPartPositions.push({ from: inlineAddedPosFrom, to: inlineAddedPosTo });
				addedDecorations.push(
					Decoration.inline(inlineAddedPosFrom, inlineAddedPosTo + 1, { class: "added-text" }),
				); // +1 to include the last character
			});

			inlineDeletedParts.forEach(([from, to]) => {
				const inlineDeletedPosStart = this._astDiffTransformer.getAstPos("old", oldIdx, from);
				const inlineDeletedPosEnd = this._astDiffTransformer.getAstPos("old", oldIdx, to);

				inlineDeletedPartPositions.push({ from: inlineDeletedPosStart, to: inlineDeletedPosEnd });
				removedDecorations.push(
					Decoration.inline(inlineDeletedPosStart, inlineDeletedPosEnd + 1, { class: "deleted-text" }), // +1 to include the last character
				);
			});

			const diffLine: ModifiedDiffLine = {
				type: "modified",
				pos: { from: newAstModifiedBlockStart, to: newAstModifiedBlockEnd },
				oldPos: { from: oldAstModifiedBlockStart, to: oldAstModifiedBlockEnd },
				diff: {
					hunks: diff,
					addedPartPositions: inlineAddedPartPositions,
					deletedPartPositions: inlineDeletedPartPositions,
				},
			};
			diffLines.push(diffLine);
		});

		return {
			addedDecorations,
			removedDecorations,
			changedContextDecorations: [],
			diffLines,
		};
	}

	makeRemovedDiffLinesToDecorators = (diffLines: DiffLine[]): Decoration[] => {
		return diffLines
			.filter((diffLine) => diffLine.type === "deleted")
			.map((diffLine) => {
				const decoration = Decoration.inline(diffLine.pos.from, diffLine.pos.to + 1, { class: "deleted-text" }); // +1 to include the last character
				return decoration;
			});
	};

	private _getAddedAndDeletedPartIdxes(diff: DiffHunk[]) {
		const addedParts: [number, number][] = [];
		const deletedParts: [number, number][] = [];

		let addedOffset = 0;
		let deletedOffset = 0;

		diff.forEach((part) => {
			if (part.type === "delete") {
				deletedParts.push([deletedOffset, deletedOffset + part.value.length - 1]);
				deletedOffset += part.value.length;
			} else if (part.type === "new") {
				addedParts.push([addedOffset, addedOffset + part.value.length - 1]);
				addedOffset += part.value.length;
			} else {
				addedOffset += part.value.length;
				deletedOffset += part.value.length;
			}
		});

		return {
			addedParts,
			deletedParts,
		};
	}
}
