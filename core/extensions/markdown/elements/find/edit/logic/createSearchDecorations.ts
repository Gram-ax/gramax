import type ArticleSearchHotkeyView from "@ext/markdown/elements/find/edit/components/ArticleSearchHotkeyView";
import type { CustomDecorations } from "@ext/markdown/elements/find/edit/components/ArticleSearchHotkeyView";
import collectTextblockMatches from "@ext/markdown/elements/find/edit/logic/collectTextblockMatches";
import type { Node } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";

const createSearchDecorations = (
	doc: Node,
	searchTerm: string,
	activeElementIndex,
	caseSensitive: boolean,
	wholeWord: boolean,
	SearchView: ArticleSearchHotkeyView,
) => {
	if (!searchTerm) {
		SearchView.updateDecorations([]);

		return DecorationSet.empty;
	}
	const decorations: Decoration[] = [];
	const items: CustomDecorations[] = [];

	const matches = collectTextblockMatches(doc, searchTerm, caseSensitive, wholeWord);

	matches.forEach(({ start, end }) => {
		const isActive = decorations.length === activeElementIndex;

		items.push({ start, end, isActive });
		decorations.push(
			Decoration.inline(start, end, {
				class: isActive ? "search-highlight search-highlight-active" : "search-highlight",
			}),
		);
	});

	SearchView.updateDecorations(items);

	return DecorationSet.create(doc, decorations);
};

export { createSearchDecorations };
