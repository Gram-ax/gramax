import type MarkdownIt from "markdown-it/lib";
import type { RuleCore } from "markdown-it/lib/parser_core";

export const LIST_OPEN_TYPES = ["bullet_list_open", "ordered_list_open"];
export const LIST_ITEM_OPEN = "list_item_open";

const detectTaskList: RuleCore = (state) => {
	const tokens = state.tokens;
	if (!tokens || !tokens.length) return;

	const Token = state.Token;

	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		if (!t) continue;

		if (t.type === LIST_ITEM_OPEN) {
			const next = tokens[i + 1];
			if (next && LIST_OPEN_TYPES.includes(next.type)) {
				const paraOpen = new Token("paragraph_open", "p", 1);
				const inline = new Token("inline", "", 0);
				inline.content = "";
				inline.children = [];
				const paraClose = new Token("paragraph_close", "p", -1);

				if (t.map) {
					paraOpen.map = [t.map[0], t.map[0]];
					inline.map = paraOpen.map;
				}

				tokens.splice(i + 1, 0, paraOpen, inline, paraClose);

				i += 3;
			}
		}
	}

	return true;
};

const listPlugin = (md: MarkdownIt) => {
	md.core.ruler.after("cleanup-task-list-inline", "nested-list-sanitizer", detectTaskList);
};

export default listPlugin;
