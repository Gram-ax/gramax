import ArticleSearchHotkeyView from "@ext/markdown/elements/find/edit/components/ArticleSearchHotkeyView";
import { Extension } from "@tiptap/core";
import { createSearchDecorations } from "@ext/markdown/elements/find/edit/logic/createSearchDecorations";
import { Plugin, PluginKey } from "prosemirror-state";

const SearchView: { instance: Partial<ArticleSearchHotkeyView> } = {
	instance: {
		updateEditor: () => {},
		destroyEditor: () => {},
		updateDecorations: () => {},
	},
};

type searchPluginProps = {
	searchTerm?: string;
	isActiveHighlight?: boolean;
	activeElementIndex?: number;
	caseSensitive?: boolean;
	wholeWord?: boolean;
};

const pluginKey = new PluginKey("search-highlight");

const searchPlugin = ({
	searchTerm = "",
	isActiveHighlight = false,
	activeElementIndex = 0,
	caseSensitive = false,
	wholeWord = false,
}: searchPluginProps) =>
	new Plugin({
		key: pluginKey,
		props: {
			decorations({ doc }) {
				if (!isActiveHighlight) return;
				return createSearchDecorations(
					doc,
					searchTerm,
					activeElementIndex,
					caseSensitive,
					wholeWord,
					SearchView.instance as ArticleSearchHotkeyView,
				);
			},
		},
	});

const ArticleSearch = Extension.create({
	name: "articleSearch",

	addKeyboardShortcuts() {
		return {
			"Mod-f": () => {
				this.editor.commands.openArticleSearch();
				return true;
			},
		};
	},

	onCreate() {
		if (!("closeSearch" in SearchView.instance)) {
			SearchView.instance = new ArticleSearchHotkeyView();
		}
		SearchView.instance.updateEditor(this.editor);
	},

	onUpdate() {
		SearchView.instance.updateEditor(this.editor);
	},

	onDestroy() {
		SearchView.instance.destroyEditor();
	},

	addProseMirrorPlugins() {
		return [searchPlugin({})];
	},

	addCommands() {
		return {
			openArticleSearch:
				() =>
				({ editor }) => {
					SearchView.instance.updateEditor(editor);
					return true;
				},
		};
	},
});

export { searchPlugin };

export default ArticleSearch;
