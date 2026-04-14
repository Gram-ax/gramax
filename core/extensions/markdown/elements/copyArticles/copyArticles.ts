import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import { handleCopy, handleCut } from "@ext/markdown/elements/copyArticles/plugins/copyCutHandlers";
import { headingPaste } from "@ext/markdown/elements/copyArticles/plugins/headingPaste";
import { pasteBetweenMark } from "@ext/markdown/elements/copyArticles/plugins/pasteBetweenMark";
import { resourcePaste } from "@ext/markdown/elements/copyArticles/plugins/resourcePaste";
import {
	transformPasted,
	transformPastedHTML,
	transformPastedText,
} from "@ext/markdown/elements/copyArticles/plugins/transformPastedTypes";
import { type Editor, Extension } from "@tiptap/core";
import { Plugin, type Transaction } from "@tiptap/pm/state";
import type { EditorView } from "prosemirror-view";

const selectNodes = (editor: Editor): boolean => {
	const { doc, selection } = editor.state;
	if (doc.childCount < 2) return false;

	const { $from } = selection;
	const isFirstNode = editor.state.doc.firstChild === $from.parent;
	const firstNodeSize = doc.firstChild.nodeSize;
	const from = isFirstNode ? 1 : firstNodeSize;
	const to = isFirstNode ? 1 + doc.firstChild.content.size : doc.content.size;

	editor.commands.setTextSelection({
		from: from,
		to: to,
	});

	return true;
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		copyArticles: {
			clearHistory: () => ReturnType;
		};
	}
}

interface CopyArticlesOptions {
	articleProps: ClientArticleProps;
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
}

const CopyArticles = Extension.create<CopyArticlesOptions>({
	name: "copyArticles",

	addOptions() {
		return {
			articleProps: null,
			apiUrlCreator: null,
			resourceService: null,
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-a": () => selectNodes(this.editor),
			"Mod-A": () => selectNodes(this.editor),
			"Mod-Z": () => this.editor.commands.undo(),
			"Mod-Y": () => this.editor.commands.redo(),
			"Shift-Mod-Z": () => this.editor.commands.redo(),
		};
	},

	addCommands() {
		return {
			clearHistory:
				() =>
				({ chain }) => {
					return chain()
						.setMeta("ignoreDeleteNode", true)
						.setMeta("ignoreDeleteMark", true)
						.setMeta("addToHistory", false)
						.run();
				},
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handleDOMEvents: {
						copy: (view: EditorView, event: ClipboardEvent) =>
							handleCopy(view, event, this.options.articleProps, this.options.resourceService),
						cut: (view: EditorView, event: ClipboardEvent) =>
							handleCut(view, event, this.options.articleProps, this.options.resourceService),
					},
					transformPastedHTML,
					transformPastedText,
					transformPasted: (slice, view) => {
						const withTypes = transformPasted(slice, view.state);
						return pasteBetweenMark(withTypes, view.state);
					},
				},
				appendTransaction: (transactions: Transaction[], oldState, newState) => {
					const titleTr = headingPaste(transactions, oldState, newState);
					if (titleTr) return titleTr;

					resourcePaste(transactions, this.options.resourceService);
					return null;
				},
			}),
		];
	},
});

export default CopyArticles;
