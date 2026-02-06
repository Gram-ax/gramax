import AstDiffDataHandler from "@ext/markdown/elements/diff/logic/AstDiffDataHandler";
import {
	AddedDiffLine,
	DeletedDiffLine,
	DiffLine,
	ModifiedDiffLine,
	Pos,
} from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import { Decoration } from "prosemirror-view";

export type DiffRenderData = {
	addedDecorations: Decoration[];
	removedDecorations: Decoration[];
	changedContextDecorations: Decoration[];
	diffLines: DiffLine[];
};

export default class DiffRenderDataHandler {
	constructor(private _astDiffDataHandler: AstDiffDataHandler) {}

	getDiffRenderData() {
		const addedDecorations: Decoration[] = [];
		const removedDecorations: Decoration[] = [];
		const diffLines: DiffLine[] = [];

		const diff = this._astDiffDataHandler.getDiff();
		const positionMapper = this._astDiffDataHandler.getPositionMapper();
		const astDiffTransformer = this._astDiffDataHandler.getAstDiffTransformer();
		const { oldStrings, newStrings } = astDiffTransformer.getStrings();

		diff.addedIdxes.forEach((idx) => {
			if (newStrings[idx] === "") {
				const addedBlockStartAndEnd = astDiffTransformer.getAstPos("new", idx, 0);
				const diffLine: AddedDiffLine = {
					type: "added",
					pos: { from: addedBlockStartAndEnd, to: addedBlockStartAndEnd },
				};
				diffLines.push(diffLine);
				return;
			}

			const addedBlockStart = astDiffTransformer.getAstPos("new", idx, 0);
			const addedBlockEnd = astDiffTransformer.getAstPos("new", idx, newStrings[idx].length - 1);

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
				const deletedBlockStartAndEnd = astDiffTransformer.getAstPos("old", idx, 0);
				const insertAfter = astDiffTransformer.getAstPos("new", prevNewParagraphIdx, prevNewParagraphPos);

				const diffLine: DeletedDiffLine = {
					type: "deleted",
					pos: { from: deletedBlockStartAndEnd, to: deletedBlockStartAndEnd },
					insertAfter,
				};
				diffLines.push(diffLine);
				return;
			}

			const deletedBlockStart = astDiffTransformer.getAstPos("old", idx, 0);
			const deletedBlockEnd = astDiffTransformer.getAstPos("old", idx, oldStrings[idx].length - 1);

			const insertAfter = astDiffTransformer.getAstPos("new", prevNewParagraphIdx, prevNewParagraphPos);

			const diffLine: DeletedDiffLine = {
				type: "deleted",
				pos: { from: deletedBlockStart, to: deletedBlockEnd },
				insertAfter,
			};
			diffLines.push(diffLine);
		});

		diff.modified.forEach(({ oldIdx, newIdx, diff }) => {
			const newAstModifiedBlockStart = astDiffTransformer.getAstPos("new", newIdx, 0);
			const newAstModifiedBlockEnd = astDiffTransformer.getAstPos("new", newIdx, newStrings[newIdx].length - 1);

			const oldAstModifiedBlockStart = astDiffTransformer.getAstPos("old", oldIdx, 0);
			const oldAstModifiedBlockEnd = astDiffTransformer.getAstPos("old", oldIdx, oldStrings[oldIdx].length - 1);

			const inlineAddedPartPositions: Pos[] = [];
			const inlineDeletedPartPositions: Pos[] = [];

			const { addedParts: inlineAddedParts, deletedParts: inlineDeletedParts } =
				this._getAddedAndDeletedPartIdxes(diff);

			inlineAddedParts.forEach(([from, to]) => {
				const inlineAddedPosFrom = astDiffTransformer.getAstPos("new", newIdx, from);
				const inlineAddedPosTo = astDiffTransformer.getAstPos("new", newIdx, to);

				inlineAddedPartPositions.push({ from: inlineAddedPosFrom, to: inlineAddedPosTo });
				addedDecorations.push(
					Decoration.inline(inlineAddedPosFrom, inlineAddedPosTo + 1, { class: "added-text" }),
				); // +1 to include the last character
			});

			inlineDeletedParts.forEach(([from, to]) => {
				const inlineDeletedPosStart = astDiffTransformer.getAstPos("old", oldIdx, from);
				const inlineDeletedPosEnd = astDiffTransformer.getAstPos("old", oldIdx, to);

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
