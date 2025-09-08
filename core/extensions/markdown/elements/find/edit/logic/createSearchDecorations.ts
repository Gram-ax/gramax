import ArticleSearchHotkeyView, {
	CustomDecorations,
} from "@ext/markdown/elements/find/edit/components/ArticleSearchHotkeyView";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node } from "prosemirror-model";
import buildSearchRegex from "./buildSearchRegex";

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

	const regex = buildSearchRegex(searchTerm, caseSensitive, wholeWord);

	doc.descendants((node: Node, pos: number) => {
		if (node.isText) {
			let match;
			while ((match = regex.exec(node.text)) !== null) {
				const start = pos + match.index;
				const end = start + match[0].length;
				const isActive = decorations.length === activeElementIndex;

				items.push({ start, end, isActive });
				decorations.push(
					Decoration.inline(start, end, {
						class: isActive ? "search-highlight search-highlight-active" : "search-highlight",
					}),
				);
			}
		}
	});

	SearchView.updateDecorations(items);

	return DecorationSet.create(doc, decorations);
};

export { createSearchDecorations };
