import type { Mark, Node } from "prosemirror-model";
import buildSearchRegex from "./buildSearchRegex";

export type TextMatch = { start: number; end: number; marks: readonly Mark[] };

const collectTextblockMatches = (
	doc: Node,
	searchTerm: string,
	caseSensitive: boolean,
	wholeWord: boolean,
): TextMatch[] => {
	if (!searchTerm) return [];

	const regex = buildSearchRegex(searchTerm, caseSensitive, wholeWord);
	const matches: TextMatch[] = [];

	doc.descendants((node: Node, pos: number) => {
		if (!node.isTextblock) return;

		const parts: string[] = [];
		const indexToPos: number[] = [];

		doc.nodesBetween(pos + 1, pos + node.nodeSize - 1, (innerNode: Node, innerPos: number) => {
			if (innerNode.isText) {
				const text = innerNode.text || "";
				for (let i = 0; i < text.length; i++) indexToPos.push(innerPos + i);
				parts.push(text.replace(/\u00A0/g, " "));
				return;
			}

			if (innerNode.isInline && innerNode.isLeaf) {
				const text = (innerNode.textContent || "").replace(/\u00A0/g, " ");
				if (!text) return;
				parts.push(text[0]);
				indexToPos.push(innerPos);
			}
		});

		const blockText = parts.join("");
		if (!blockText) return false;

		regex.lastIndex = 0;
		let match: RegExpExecArray = null;
		match = regex.exec(blockText);
		while (match !== null) {
			const startIndex = match.index;
			const endIndex = startIndex + match[0].length;
			if (startIndex < 0 || endIndex > indexToPos.length) break;

			const start = indexToPos[startIndex];
			const end = indexToPos[endIndex - 1] + 1;
			const markPos = Math.min(start + 1, doc.content.size);
			const marks = doc.resolve(markPos).marks();
			matches.push({ start, end, marks });
			match = regex.exec(blockText);
		}
		return false;
	});

	return matches;
};

export default collectTextblockMatches;
