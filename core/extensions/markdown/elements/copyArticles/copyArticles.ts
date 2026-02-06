import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { copy } from "@ext/markdown/elements/copyArticles/handlers/copy";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import headingPasteFormatter from "@ext/markdown/elements/heading/edit/logic/headingPasteFormatter";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import { Editor, Extension } from "@tiptap/core";
import { Node, Slice } from "@tiptap/pm/model";
import { Plugin, Transaction } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { Fragment } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

const mapFragment = (fragment: Fragment, transform: (node: Node) => Node) => {
	const mapContent = (content: Fragment) => {
		const children = [];

		content.forEach((node) => {
			let newContent = node.content;
			if (newContent && newContent.size > 0) newContent = mapContent(newContent);

			const newNode = transform(node.copy(newContent));
			children.push(newNode);
		});

		return Fragment.fromArray(children);
	};

	return mapContent(fragment);
};

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
						copy: (view: EditorView, event: ClipboardEvent) => {
							event.preventDefault();
							copy(view, event, this.options.articleProps, this.options.resourceService);
						},
						cut: (view: EditorView, event: ClipboardEvent) => {
							event.preventDefault();
							copy(view, event, this.options.articleProps, this.options.resourceService, {
								cut: view.editable,
							});
						},
					},
					transformPastedHTML(html) {
						return html?.replaceAll("[object Object]", "");
					},
					transformPasted(slice, view) {
						const headingAllowed = readyToPlace(view.state, "heading");
						if (headingAllowed) return slice;

						return new Slice(
							mapFragment(slice.content, (node) => {
								if (node.type.name !== "heading") return node;
								return headingPasteFormatter(view.state, node);
							}),
							slice.openStart,
							slice.openEnd,
						);
					},
				},
				appendTransaction: (transactions: Transaction[]) => {
					transactions.forEach((tr: Transaction) => {
						const $history = tr.getMeta("history$");
						if (!tr.docChanged || !$history) return;

						const notDeletedSrc = new Set<string>();
						const historyState = $history.historyState;
						const items = $history.redo ? historyState.done.items : historyState.undone.items;
						const values = items?.values || [];

						values.forEach((item) => {
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
