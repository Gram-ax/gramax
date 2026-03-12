import type MarkdownIt from "markdown-it";
import type ParserBlock from "markdown-it/lib/parser_block";
import type StateBlock from "markdown-it/lib/rules_block/state_block";

const changedTokenize = (ParserBlockCtor: ParserBlock) => (state: StateBlock, startLine: number, endLine: number) => {
	const rules = ParserBlockCtor.ruler.getRules("");
	const len = rules.length;
	const maxNesting = (state.md.options as MarkdownIt.Options & { maxNesting?: number }).maxNesting;
	let line = startLine;
	let hasEmptyLines = false;

	while (line < endLine) {
		state.line = line = state.skipEmptyLines(line);
		if (line >= endLine) {
			break;
		}

		if (state.sCount[line] < state.blkIndent) {
			break;
		}

		if (state.level >= maxNesting) {
			state.line = endLine;
			break;
		}

		let ok = false;

		for (let i = 0; i < len; i++) {
			ok = rules[i](state, line, endLine, false);
			if (ok) break;
		}

		if (!ok) throw new Error("none of the block rules matched");

		state.tight = !hasEmptyLines;

		if (state.isEmpty(state.line - 1)) {
			hasEmptyLines = true;
		}

		line = state.line;

		if (line < endLine && state.isEmpty(line)) {
			hasEmptyLines = true;
			line++;
			state.line = line;
		}
	}
};

const allowNonAdvancingBlockRules = (ParserBlockCtor: ParserBlock) => {
	ParserBlockCtor.constructor.prototype.tokenize = changedTokenize(ParserBlockCtor);
};

export default allowNonAdvancingBlockRules;
