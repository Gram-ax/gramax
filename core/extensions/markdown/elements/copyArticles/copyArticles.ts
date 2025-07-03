import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { copyArticleResource } from "@ext/markdown/elements/copyArticles/copyPasteArticleResource";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import { Editor, Extension } from "@tiptap/core";
import { Node, Slice } from "@tiptap/pm/model";
import { Plugin, Transaction } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { EditorView } from "prosemirror-view";

const processNode = (childNode: Node, resourceService: ResourceServiceType, notDeletedSrc?: Set<string>) => {
	if (
		!childNode.isText &&
		Object.keys(childNode.attrs).length !== 0 &&
		childNode.attrs.src &&
		!notDeletedSrc.has(childNode.attrs.src)
	) {
		const name = childNode.attrs.src.slice(2);
		void resourceService.setResource(name, resourceService.getBuffer(childNode.attrs.src));
	}

	for (let index = 0; index < childNode.content.childCount; index++) {
		processNode(childNode.content.child(index), resourceService, notDeletedSrc);
	}
};

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

interface CopyArticlesOptions {
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
}

const CopyArticles = Extension.create<CopyArticlesOptions>({
	name: "copyArticles",

	addOptions() {
		return {
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

	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handleDOMEvents: {
						copy: (view: EditorView, event: ClipboardEvent) => {
							event.preventDefault();
							copyArticleResource(view, event, this.options.resourceService);
						},
						cut: (view: EditorView, event: ClipboardEvent) => {
							event.preventDefault();
							copyArticleResource(view, event, this.options.resourceService, view.editable);
						},
					},
					transformPastedHTML(html) {
						return html?.replaceAll("[object Object]", "");
					},
				},
				appendTransaction: (transactions: Transaction[]) => {
					transactions.forEach((tr: Transaction) => {
						const $history = tr.getMeta("history$");
						if (!tr.docChanged || !$history) return;

						const notDeletedSrc = new Set<string>();
						const historyState = $history.historyState;
						const items = $history.redo ? historyState.done.items : historyState.undone.items;

						items.values.forEach((item) => {
							const slice: Slice = item.step.slice;
							if (!slice?.content?.childCount) return;

							slice.content.forEach((node) => {
								if (!node.attrs.src) return;
								notDeletedSrc.add(node.attrs.src);
							});
						});

						tr.steps.forEach((step) => {
							if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
								step.slice.content.forEach((node: Node) => {
									processNode(node, this.options.resourceService, notDeletedSrc);
								});
							}
						});
					});

					return null;
				},
			}),
		];
	},
});

export default CopyArticles;
