import { DiffLine } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { Decoration } from "prosemirror-view";

const convertDeletedDifflines = (diffLines: DiffLine[]) => {
	const removedDecorations: Decoration[] = [];
	const convertedDiffLines: DiffLine[] = diffLines
		.map((diffLine) => {
			if (diffLine.type !== "deleted") return diffLine;
			const decoration = Decoration.inline(diffLine.pos.from, diffLine.pos.to + 1, { class: "deleted-text" }); // +1 to include the last character
			removedDecorations.push(decoration);
			return null;
		})
		.filter((x) => x !== null);

	return { convertedDiffLines, removedDecorations };
};

export default convertDeletedDifflines;
