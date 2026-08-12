import {
	starPasteRegex as emPasteRegex,
	underscorePasteRegex as underscoreEmPasteRegex,
} from "@ext/markdown/elements/em/edit/em";
import {
	starPasteRegex as strongPasteRegex,
	underscorePasteRegex as underscoreStrongPasteRegex,
} from "@ext/markdown/elements/strong/edit/strong";

type MarkdownDetectionRule = {
	regexp: RegExp;
	name: string;
	type: "node" | "mark";
};

export const markdownDetection: Record<string, MarkdownDetectionRule> = {
	heading: { regexp: /^(#{1,4})\s+.+$/gm, name: "heading", type: "node" },
	bulletList: { regexp: /^\s*[-+*]\s+.*/gm, name: "bulletList", type: "node" },
	orderedList: { regexp: /^\s*\d+\.\s+.*/gm, name: "orderedList", type: "node" },
	listItem: { regexp: /^\s*(?:[-+*]|\d+\.)\s+.*/gm, name: "listItem", type: "node" },
	taskList: { regexp: /^\s*[-+*]\s+\[[ xX]\]\s+.*/gm, name: "taskList", type: "node" },
	taskItem: { regexp: /^\s*[-+*]\s+\[[ xX]\]\s+.*/gm, name: "taskItem", type: "node" },
	blockquote: { regexp: /^\s*>\s+.*/gm, name: "blockquote", type: "node" },
	codeBlock: { regexp: /^\s*```[\s\S]*?^\s*```\s*$/gm, name: "codeBlock", type: "node" },
	table: {
		regexp: /((?:\| *[^|\r\n]+ *)+\|)(?:\r?\n)((?:\|[ :]?-+[ :]?)+\|)((?:(?:\r?\n)(?:\| *[^|\r\n]+ *)+\|)+)/gm,
		name: "table",
		type: "node",
	},
	image: { regexp: /!\[[^\]]*\]\([^\s)]+(?:\s+["'][^"']*["'])?\)/gm, name: "image", type: "node" },
	bold: { regexp: strongPasteRegex, name: "bold", type: "mark" },
	strong: { regexp: underscoreStrongPasteRegex, name: "strong", type: "mark" },
	italic: { regexp: emPasteRegex, name: "italic", type: "mark" },
	em: { regexp: underscoreEmPasteRegex, name: "em", type: "mark" },
	strike: { regexp: /~~[^~]+~~/gm, name: "strike", type: "mark" },
	code: { regexp: /`[^`\r\n]+`/gm, name: "code", type: "mark" },
	link: { regexp: /^\s*\[(.*?)\]\((.*?)\)/gm, name: "link", type: "mark" },
};
