import { createDataValue } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import { createToken } from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/annotations";
import MarkdownIt from "markdown-it";
import ParserBlock from "markdown-it/lib/parser_block";
import StateBlock from "markdown-it/lib/rules_block/state_block";

const blockType = "note";
const noteTag = ":::";

const noteBlock: ParserBlock.RuleBlock = (state: StateBlock, startLine: number, endLine: number, silent: boolean) => {
	const start = state.bMarks[startLine] + state.tShift[startLine];
	const finish = state.eMarks[startLine];
	const lineText = state.src.slice(start, finish).trim();

	if (!lineText.startsWith(noteTag)) return false;

	if (lineText === noteTag) {
		if (!silent) createToken(state, `/${blockType}`);
		state.line = startLine + 1;
		return true;
	}

	const match = lineText.match(/:::([^\s:]*)(?::(true|false))?\s*(.*)?$/);
	if (!match) return false;
	const [, type, collapsed, title] = match;

	if (silent) return true;
	const formattedString = `${blockType} ${createDataValue({ type, title, collapsed })}`;
	createToken(state, formattedString);
	state.line = startLine + 1;
	return true;
};

const notePlugin = (md: MarkdownIt) => {
	md.block.ruler.before("paragraph", blockType, noteBlock, {
		alt: ["paragraph", "blockquote"],
	});
};

export default notePlugin;
