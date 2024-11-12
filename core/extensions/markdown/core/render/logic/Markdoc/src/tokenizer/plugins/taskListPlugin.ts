import { CONTAINS_TASK_LIST } from "@ext/markdown/elements/list/edit/models/bulletList/bulletListToken";

const checkboxRegExp = /^\[( |x|X)\]/;

export default function (md, options) {
	md.core.ruler.after("inline", "github-task-lists", function (state) {
		let tokens = state.tokens;
		for (let i = 2; i < tokens.length; i++) {
			if (isTodoItem(tokens, i)) {
				const checked = getCheckboxAttr(tokens[i]);
				todoify(tokens[i], state.Token);

				if (checked !== null) attrSet(tokens[i - 2], "checked", String(checked));

				attrSet(tokens[parentToken(tokens, i - 2)], CONTAINS_TASK_LIST, "true");
			}
		}
	});
}

function attrSet(token, name, value) {
	const index = token.attrIndex(name);
	const attr = [name, value];

	if (index < 0) {
		token.attrPush(attr);
	} else {
		token.attrs[index] = attr;
	}
}

function parentToken(tokens, index) {
	let targetLevel = tokens[index].level - 1;
	for (let i = index - 1; i >= 0; i--) {
		if (tokens[i].level === targetLevel) {
			return i;
		}
	}
	return -1;
}

function isTodoItem(tokens, index) {
	return (
		isInline(tokens[index]) &&
		isParagraph(tokens[index - 1]) &&
		isListItem(tokens[index - 2]) &&
		startsWithTodoMarkdown(tokens[index])
	);
}

function getCheckboxAttr(token) {
	const match = token.content.match(checkboxRegExp);
	return match ? match[1].toLowerCase() === "x" : null;
}

function todoify(token, TokenConstructor) {
	token.children[0].content = token.children[0].content.slice(4);
	token.content = token.content.slice(4);
}

function isInline(token) {
	return token.type === "inline";
}
function isParagraph(token) {
	return token.type === "paragraph_open";
}
function isListItem(token) {
	return token.type === "list_item_open";
}

function startsWithTodoMarkdown(token) {
	return checkboxRegExp.test(token.content);
}
