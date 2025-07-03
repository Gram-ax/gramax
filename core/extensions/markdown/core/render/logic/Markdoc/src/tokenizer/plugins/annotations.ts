import { Schemes } from "@ext/markdown/core/Parser/Parser";
import { OPEN as gitConflictOpen } from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/gitConflictPlugin";
import {
	blockElements,
	blockWithInlineElements,
	inlineElements,
	selfClosingTags,
} from "@ext/markdown/elements/htmlTag/logic/utils";
import type MarkdownIt from "markdown-it/lib";
import { PluginWithOptions } from "markdown-it/lib";
import { RuleBlock } from "markdown-it/lib/parser_block";
import { RuleInline } from "markdown-it/lib/parser_inline";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import Function from "../../ast/function";
import Variable from "../../ast/variable";
import { parse, SyntaxError as TagSyntaxError } from "../../grammar/tag";
import type { StateBlock, Token } from "../../types";
import { findTagEnd, tagWraps } from "../../utils";

const getHtmlTagType = (name: string) => {
	const lowerName = name.toLowerCase();

	if (selfClosingTags.includes(lowerName)) return "selfClosingHtmlTag";
	if (blockElements.includes(lowerName)) return "blockHtmlTag";
	if (blockWithInlineElements.includes(lowerName)) return "blockWithInlineHtmlTag";
	if (inlineElements.includes(lowerName)) return "inlineHtmlTag";
	return null;
};

const transformUnschemedTag = (meta: any, options?: { tags?: Schemes["tags"]; allowHtmlFallback?: boolean }) => {
	if (!meta.tag || !options?.tags) return meta;

	const hasScheme = !!options.tags[meta.tag];
	if (hasScheme) return meta;
	if (!options.allowHtmlFallback) return null;

	const tagType = getHtmlTagType(meta.tag);
	if (!tagType) return null;
	return {
		...meta,
		tag: tagType,
		attributes: [
			{ name: "name", value: meta.tag },
			{ name: "attributes", value: meta.attributes || [] },
		],
	};
};

export const createToken = (
	state: StateBlock | StateInline,
	content: string,
	contentStart?: number,
	options?: { tags?: Schemes["tags"]; allowHtmlFallback?: boolean },
): Token => {
	try {
		const { type, meta, nesting = 0 } = parse(content, { Variable, Function });

		const transformedMeta = transformUnschemedTag(meta, options);
		if (!transformedMeta) return null;
		const token = state.push(transformedMeta.tag === "selfClosingHtmlTag" ? "tag" : type, "", nesting);
		token.info = content;
		token.meta = transformedMeta;

		if (!state.delimiters) {
			state.delimiters = [];
		}

		return token;
	} catch (error) {
		if (!(error instanceof TagSyntaxError)) throw error;
		return null;
	}
};

const block =
	(tags: Schemes["tags"]): RuleBlock =>
	(state, startLine, _, silent) => {
		const start = state.bMarks[startLine] + state.tShift[startLine];
		const finish = state.eMarks[startLine];

		const tagMatch = Object.entries(tagWraps).find(([_, tag]) => state.src.startsWith(tag.open, start));

		if (!tagMatch) return false;

		const [tagName, currentTag] = tagMatch;

		const tagEnd = findTagEnd(state.src, start, currentTag.close);
		const lastPossible = state.src.slice(0, finish).trim().length;

		if (!tagEnd || tagEnd < lastPossible - currentTag.close.length) return false;

		const contentStart = start + currentTag.open.length;
		const content = state.src.slice(contentStart, tagEnd).trim();
		const lines = content.split("\n").length;

		if (content[0] === "$") return false;

		if (silent) return true;

		const token = createToken(state, content, contentStart, {
			tags,
			allowHtmlFallback: tagName === "angle",
		});
		if (!token) return false;

		token.map = [startLine, startLine + lines];
		state.line += lines;
		return true;
	};

const inline =
	(tags: Schemes["tags"]): RuleInline =>
	(state, silent): boolean => {
		if (state.src.startsWith(gitConflictOpen)) return false;

		const tagMatch = Object.entries(tagWraps).find(([_, tag]) => state.src.startsWith(tag.open, state.pos));
		if (!tagMatch) return false;

		const [tagName, currentTag] = tagMatch;
		const tagEnd = findTagEnd(state.src, state.pos, currentTag.close);
		if (!tagEnd) return false;

		const content = state.src.slice(state.pos + currentTag.open.length, tagEnd);
		if (!silent) {
			const token = createToken(state, content.trim(), state.pos, {
				tags,
				allowHtmlFallback: tagName === "angle",
			});
			if (!token) return false;
		}

		state.pos = tagEnd + currentTag.close.length;
		return true;
	};

const plugin: PluginWithOptions = (md: MarkdownIt, options: { tags: Schemes["tags"] }) => {
	md.block.ruler.before("paragraph", "annotations", block(options.tags), {
		alt: ["paragraph", "blockquote"],
	});
	md.inline.ruler.push("containers", inline(options.tags));
};

export default plugin;
