import type { JSONContent } from "@tiptap/core";

export default function extractPreviewFromEditTree(editTree: JSONContent, maxLength = 100): string {
	if (!editTree) return "";

	const parts: string[] = [];
	const walk = (node: JSONContent) => {
		if (parts.join(" ").length >= maxLength) return;
		if (node.text) parts.push(node.text);
		if (node.content) node.content.forEach(walk);
	};
	walk(editTree);

	let text = parts.join(" ").replace(/\s+/g, " ").trim();
	if (text.length > maxLength) text = text.substring(0, maxLength).trim();
	return text;
}
