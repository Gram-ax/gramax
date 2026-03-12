import {
	Tag as MarkdocTag,
	type RenderableTreeNode,
	type RenderableTreeNodes,
} from "@ext/markdown/core/render/logic/Markdoc";
import { CITATION_PLACEHOLDER_REGEX } from "@ext/serach/types";

const superscriptDigits = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const toSuperscript = (n: number): string =>
	String(n)
		.split("")
		.map((d) => superscriptDigits[Number(d)])
		.join("");

const chatCitations = (root: RenderableTreeNodes): RenderableTreeNodes => {
	const transformNode = (node: RenderableTreeNodes): RenderableTreeNodes => {
		if (Array.isArray(node)) {
			return node.flatMap((child) => transformNode(child)) as RenderableTreeNodes;
		}

		if (typeof node === "string") {
			CITATION_PLACEHOLDER_REGEX.lastIndex = 0;

			const result: RenderableTreeNode[] = [];
			let lastIndex = 0;
			let match: RegExpExecArray | null;

			while ((match = CITATION_PLACEHOLDER_REGEX.exec(node)) !== null) {
				const [full, indexStr, rawLogicPath, relativePath] = match;
				const index = Number(indexStr);
				const logicPath = rawLogicPath.replace(/[\u200B\u2060]/g, "");
				const href = `/${logicPath}`;
				if (match.index > lastIndex) {
					result.push(node.slice(lastIndex, match.index));
				}
				result.push(
					new MarkdocTag(
						"Link",
						{
							index,
							href,
							resourcePath: relativePath,
						},
						[`${toSuperscript(index)}↗`],
					),
				);
				lastIndex = match.index + full.length;
			}

			if (lastIndex === 0) return node;

			if (lastIndex < node.length) {
				result.push(node.slice(lastIndex));
			}

			return result;
		}

		if (node && typeof node === "object" && (node as any).$$mdtype === "Tag") {
			const tag = node as MarkdocTag;
			const children = (tag.children ?? []).flatMap((ch) => transformNode(ch)) as any;
			return new MarkdocTag(tag.name, tag.attributes, children);
		}

		return node;
	};

	return transformNode(root);
};

export default chatCitations;
