import { markdownDetection } from "@ext/markdown/elements/pasteMarkdown/logic/markdownDetection";
import type { Slice } from "prosemirror-model";

export const hasSemanticHtml = (slice: Slice): boolean => {
	let hasSemanticContent = false;

	slice.content.descendants((node) => {
		const hasSemanticNode = Object.values(markdownDetection).some(
			(rule) => rule.type === "node" && rule.name === node.type.name,
		);
		const hasSemanticMark = node.marks.some((mark) =>
			Object.values(markdownDetection).some((rule) => rule.type === "mark" && rule.name === mark.type.name),
		);

		if (hasSemanticNode || hasSemanticMark) {
			hasSemanticContent = true;
			return false;
		}
	});

	return hasSemanticContent;
};
