import { JSONContent } from "@tiptap/react";
import { RequestParagraphModel } from "gx-ai/dist/gpt/styleGuideGpt/styleGuideGptRequest";

function extractSentences(text: string): string[] {
	const texts = text.split(/(\.+)/).reduce((acc: string[], part: string) => {
		if (part.match(/\.+/)) {
			acc[acc.length - 1] += part;
		} else if (part) {
			acc.push(part);
		}
		return acc;
	}, []);

	return texts;
}

function astToSentences(ast: JSONContent): RequestParagraphModel[] {
	const result: RequestParagraphModel[] = [];
	let idx = 0;

	const traverse = (node: JSONContent, path: string[] = []) => {
		if (node.type === "paragraph" || node.type === "heading") {
			const text = node.content
				?.map((child) => {
					if (child?.marks?.[0]?.type === "bold") {
						return `<strong>${child.text}</strong>`;
					}
					if (child?.marks?.[0]?.type === "code") {
						return `<code>${child.text}</code>`;
					}
					if (child?.marks?.[0]?.type === "italic") {
						return `<em>${child.text}</em>`;
					}
					return child.text;
				})
				.join("");
			if (!text) return;
			extractSentences(text).forEach((s) => {
				result.push({
					text: s.trim(),
					type: node.type === "paragraph" ? "Обычный текст" : "Заголовок",
					id: idx++,
				});
			});
		} else if (node.content && Array.isArray(node.content)) {
			node.content.forEach((child) => {
				traverse(child, [...path, node.type]);
			});
		}
	};

	traverse(ast);
	return result;
}

export default astToSentences;
