import t from "@ext/localization/locale/translate";
import { Editor, Extension } from "@tiptap/core";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { editName as blockFieldEditName } from "@ext/markdown/elements/blockContentField/consts";

export interface PlaceholderOptions {
	emptyEditorClass: string;
	emptyNodeClass: string;
	placeholder:
		| ((PlaceholderProps: { editor: Editor; node: ProsemirrorNode; pos: number; hasAnchor: boolean }) => string)
		| string;
	showOnlyWhenEditable: boolean;
	showOnlyCurrent: boolean;
	includeChildren: boolean;
}

const getParentNode = (editor: Editor, pos: number) => {
	const $pos = editor.state.doc.resolve(pos);
	const parent = $pos.parent;

	return parent;
};

export const Placeholder = Extension.create<PlaceholderOptions>({
	name: "placeholder",

	addOptions() {
		return {
			emptyEditorClass: "is-editor-empty",
			emptyNodeClass: "is-empty",
			placeholder: "Write something …",
			showOnlyWhenEditable: false,
			showOnlyCurrent: false,
			includeChildren: true,
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("placeholder"),
				props: {
					decorations: ({ doc, selection }) => {
						const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;
						const { anchor } = selection;
						const decorations: Decoration[] = [];

						if (!active) {
							return null;
						}

						doc.descendants((node, pos) => {
							const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
							const isEmpty = !node.isLeaf && !node.childCount;

							if ((hasAnchor || !this.options.showOnlyCurrent) && isEmpty) {
								const classes = [this.options.emptyNodeClass];

								if (this.editor.isEmpty) {
									classes.push(this.options.emptyEditorClass);
								}

								const decoration = Decoration.node(pos, pos + node.nodeSize, {
									class: classes.join(" "),
									"data-placeholder":
										typeof this.options.placeholder === "function"
											? this.options.placeholder({
													editor: this.editor,
													node,
													pos,
													hasAnchor,
											  })
											: this.options.placeholder,
								});

								decorations.push(decoration);
							}

							return this.options.includeChildren;
						});

						return DecorationSet.create(doc, decorations);
					},
				},
			}),
		];
	},
});

export default Placeholder.configure({
	placeholder: ({ editor, node, pos }) => {
		if (editor.state.doc.firstChild.type.name === "paragraph" && editor.state.doc.firstChild === node)
			return t("article.title");

		if (
			node.type.name === "paragraph" &&
			editor.state.doc.content.child(1) === node &&
			editor.state.doc.content.childCount === 2
		)
			return t("article.placeholder");

		const parent = getParentNode(editor, pos);

		if (
			parent.type.name === blockFieldEditName &&
			node.type.name === "paragraph" &&
			parent.firstChild === node &&
			parent.childCount === 1
		)
			return parent.attrs.placeholder;
		if (node.attrs.placeholder) return node.attrs.placeholder;
	},
});
