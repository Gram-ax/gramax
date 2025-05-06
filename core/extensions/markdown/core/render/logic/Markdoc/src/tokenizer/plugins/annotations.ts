import type MarkdownIt from "markdown-it/lib";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import Function from "../../ast/function";
import Variable from "../../ast/variable";
import { parse, SyntaxError as TagSyntaxError } from "../../grammar/tag";
import type { StateBlock, Token } from "../../types";
import { tagWraps, findTagEnd } from "../../utils";
import { Schemes } from "@ext/markdown/core/Parser/Parser";
import { PluginWithOptions } from "markdown-it/lib";
import { RuleBlock } from "markdown-it/lib/parser_block";
import { OPEN as gitConflictOpen } from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/gitConflictPlugin";

const checkTag = (meta: any, options?: { tags?: Schemes["tags"] }) => {
	if (!meta.tag || !options?.tags) return true;

	const hasScheme = !!options.tags[meta.tag];
	if (hasScheme) return true;
	return false;
};

export const createToken = (
	state: StateBlock | StateInline,
	content: string,
	contentStart?: number,
	options?: { tags?: Schemes["tags"] },
): Token => {
	try {
		const { type, meta, nesting = 0 } = parse(content, { Variable, Function });

		if (!checkTag(meta, options)) return null;

		const token = state.push(type, "", nesting);
		token.info = content;
		token.meta = meta;

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

		const currentTag = Object.values(tagWraps).find((tag) => state.src.startsWith(tag.open, start));

		if (!currentTag) return false;

		const tagEnd = findTagEnd(state.src, start, currentTag.close);
		const lastPossible = state.src.slice(0, finish).trim().length;

		if (!tagEnd || tagEnd < lastPossible - currentTag.close.length) return false;

		const contentStart = start + currentTag.open.length;
		const content = state.src.slice(contentStart, tagEnd).trim();
		const lines = content.split("\n").length;

		if (content[0] === "$") return false;

		if (silent) return true;

		const token = createToken(state, content, contentStart, { tags });
		if (!token) return false;

		token.map = [startLine, startLine + lines];
		state.line += lines;
		return true;
	};

const inline =
	(tags: Schemes["tags"]) =>
	(state: StateInline, silent: boolean): boolean => {
		if (state.src.startsWith(gitConflictOpen)) return false;

		const currentTag = Object.values(tagWraps).find((tag) => state.src.startsWith(tag.open, state.pos));
		if (!currentTag) return false;

		const tagEnd = findTagEnd(state.src, state.pos, currentTag.close);
		if (!tagEnd) return false;

		const content = state.src.slice(state.pos + currentTag.open.length, tagEnd);
		if (!silent) {
			const token = createToken(state, content.trim(), state.pos, { tags });
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
