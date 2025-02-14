import type MarkdownIt from "markdown-it/lib";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import Function from "../../ast/function";
import Variable from "../../ast/variable";
import { parse, type SyntaxError } from "../../grammar/tag";
import type { StateBlock, Token } from "../../types";
import { CLOSE, OPEN, findTagEnd, parseTags } from "../../utils";

function createToken(state: StateBlock | StateInline, content: string, contentStart?: number): Token {
	try {
		const { type, meta, nesting = 0 } = parse(content, { Variable, Function });
		const token = state.push(type, "", nesting);
		token.info = content;
		token.meta = meta;

		if (!state.delimiters) {
			state.delimiters = [];
		}

		return token;
	} catch (error) {
		if (!(error instanceof SyntaxError)) throw error;

		const {
			message,
			location: { start, end },
		} = error as SyntaxError;
		const location = contentStart
			? {
					start: { offset: start.offset + contentStart },
					end: { offset: end.offset + contentStart },
			  }
			: null;

		const token = state.push("error", "", 0);
		token.meta = { error: { message, location } };
		return token;
	}
}

function block(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
	const start = state.bMarks[startLine] + state.tShift[startLine];
	const finish = state.eMarks[startLine];

	if (!state.src.startsWith(OPEN, start)) return false;

	const tagEnd = findTagEnd(state.src, start);
	const lastPossible = state.src.slice(0, finish).trim().length;

	if (!tagEnd || tagEnd < lastPossible - CLOSE.length) return false;

	const contentStart = start + OPEN.length;
	const content = state.src.slice(contentStart, tagEnd).trim();
	const lines = content.split("\n").length;

	if (content[0] === "$") return false;

	if (silent) return true;

	const token = createToken(state, content, contentStart);
	token.map = [startLine, startLine + lines];
	state.line += lines;
	return true;
}

function inline(state: StateInline, silent: boolean): boolean {
	if (!state.src.startsWith(OPEN, state.pos)) return false;

	const tagEnd = findTagEnd(state.src, state.pos);
	if (!tagEnd) return false;

	const content = state.src.slice(state.pos + OPEN.length, tagEnd);
	if (!silent) createToken(state, content.trim());

	state.pos = tagEnd + CLOSE.length;
	return true;
}

export default function plugin(md: MarkdownIt /* options */) {
	md.block.ruler.before("paragraph", "annotations", block, {
		alt: ["paragraph", "blockquote"],
	});
	md.inline.ruler.push("containers", inline);
}
