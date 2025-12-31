import AstDiffDataHandler from "@ext/markdown/elements/diff/logic/AstDiffDataHandler";
import { DiffAstComment } from "@ext/markdown/elements/diff/logic/commentsDiff/CommentsDiff";
import { CommentDiffLine, Pos } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

const getParagraphCommentsDiffLines = (
	astDiffDataHandler: AstDiffDataHandler,
	paragraphCommentsDiff: DiffAstComment[],
): CommentDiffLine[] => {
	const astDiffTransformer = astDiffDataHandler.getAstDiffTransformer();
	const { deletedIdxes, modified } = astDiffDataHandler.getDiff();
	const { oldStrings, newStrings } = astDiffTransformer.getStrings();

	const oldPositions: { pos: Pos; idx: number }[] = oldStrings.map((str, idx) => {
		return {
			pos: {
				from: astDiffTransformer.getAstPos("old", idx, 0),
				to: astDiffTransformer.getAstPos("old", idx, str.length - 1),
			},
			idx,
		};
	});
	const newPositions: { pos: Pos; idx: number }[] = newStrings.map((str, idx) => {
		return {
			pos: {
				from: astDiffTransformer.getAstPos("new", idx, 0),
				to: astDiffTransformer.getAstPos("new", idx, str.length - 1),
			},
			idx,
		};
	});
	const diffLines: CommentDiffLine[] = [];

	const addItemToDiffLines = (paragraphPos: { pos: Pos }, commentDiff: DiffAstComment) => {
		const alreadyExistDiffLine = diffLines.find(
			(diffLine) => diffLine.pos.from === paragraphPos.pos.from && diffLine.pos.to === paragraphPos.pos.to,
		);
		if (alreadyExistDiffLine) {
			alreadyExistDiffLine.comments.push(commentDiff);
		} else {
			diffLines.push({ type: "comment", pos: paragraphPos.pos, comments: [commentDiff] });
		}
	};

	paragraphCommentsDiff.forEach((commentDiff) => {
		const isDeleted = commentDiff.type === FileStatus.delete;
		if (isDeleted) {
			const oldParagraphData: { pos: Pos; idx: number } = oldPositions.find(
				(oldData) => oldData.pos.from <= commentDiff.oldPos.from && oldData.pos.to >= commentDiff.oldPos.to,
			);
			if (!oldParagraphData) return;

			const isCommentInDeletedParagraph = deletedIdxes.includes(oldParagraphData.idx);
			if (isCommentInDeletedParagraph) return;

			const modifiedParagraphPosition = modified.find(
				(modifiedData) => modifiedData.oldIdx === oldParagraphData.idx,
			);

			if (modifiedParagraphPosition) {
				const newParagraphPosition = newPositions[modifiedParagraphPosition.newIdx];
				addItemToDiffLines(newParagraphPosition, commentDiff);
				return;
			}

			const oldString = oldStrings[oldParagraphData.idx];
			const oldStringInNewStrings = newStrings.find((str) => str === oldString);
			if (!oldStringInNewStrings) return;

			const idx = newStrings.indexOf(oldStringInNewStrings);
			const newParagraphPosition = newPositions[idx];
			addItemToDiffLines(newParagraphPosition, commentDiff);

			return;
		}

		const paragraphData: { pos: Pos; idx: number } = newPositions.find(
			(newData) => newData.pos.from <= commentDiff.pos.from && newData.pos.to >= commentDiff.pos.to,
		);

		if (!paragraphData) return;

		addItemToDiffLines(paragraphData, commentDiff);
	});

	return diffLines;
};

export default getParagraphCommentsDiffLines;
