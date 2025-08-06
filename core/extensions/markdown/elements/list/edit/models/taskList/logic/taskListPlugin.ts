import { CONTAINS_TASK_LIST } from "@ext/markdown/elements/list/edit/models/bulletList/bulletListToken";
import { CHECKED_ATTR } from "@ext/markdown/elements/list/edit/models/listItem/model/listItem";
import type MarkdownIt from "markdown-it/lib";
import { RuleBlock } from "markdown-it/lib/parser_block";
import { RuleCore } from "markdown-it/lib/parser_core";
import Token from "markdown-it/lib/token";

const checkboxRegExp = /^\[( |x|X)\][ ]*/;

const detectTaskList: RuleBlock = (state, startLine) => {
	const tokens = state.tokens;
	if (!tokens.length) return;

	const start = state.bMarks[startLine] + state.tShift[startLine];
	const finish = state.eMarks[startLine];
	const src = state.src.substring(start, finish);
	const match = src.match(checkboxRegExp);
	const lastTokenIndex = tokens.length - 1;

	if (tokens[lastTokenIndex].type !== "list_item_open" || !match) return;

	state.tShift[startLine] += match[0].length;

	attrSet(tokens[lastTokenIndex], CHECKED_ATTR, String(match[1].toLowerCase() === "x"));
	attrSet(tokens[parentToken(tokens, lastTokenIndex)], CONTAINS_TASK_LIST, "true");

	return true;
};

const cleanupTaskListInline: RuleCore = (state) => {
	const tokens = state.tokens;
	for (let i = 2; i < tokens.length; i++) {
		if (isTodoItem(tokens, i)) {
			todoify(tokens[i]);
		}
	}
};

const attrSet = (token: Token, name: string, value: string) => {
	const index = token.attrIndex(name);
	const attr: [string, string] = [name, value];

	if (index < 0) {
		token.attrPush(attr);
	} else {
		token.attrs[index] = attr;
	}
};

const parentToken = (tokens: Token[], index: number) => {
	const targetLevel = tokens[index].level - 1;
	for (let i = index - 1; i >= 0; i--) {
		if (tokens[i].level === targetLevel) {
			return i;
		}
	}
	return -1;
};

const isTodoItem = (tokens: Token[], index: number) => {
	return (
		tokens[index].type === "inline" &&
		tokens[index - 1].type === "paragraph_open" &&
		tokens[index - 2].type === "list_item_open" &&
		tokens[index - 2].attrs?.some(([key]) => key === CHECKED_ATTR)
	);
};

const todoify = (token: Token) => {
	token.children[0].content = token.children[0].content.slice(4);
	token.content = token.content.slice(4);
};

export default function (md: MarkdownIt) {
	md.block.ruler.after("list", "detect-task-list", detectTaskList);
	md.core.ruler.after("inline", "cleanup-task-list-inline", cleanupTaskListInline);
}
