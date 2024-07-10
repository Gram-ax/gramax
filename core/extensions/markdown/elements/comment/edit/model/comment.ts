import eventEmitter from "@core/utils/eventEmitter";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import CommentFocusTooltip from "../logic/CommentFocusTooltip";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		comment: {
			toggleComment: (attributes: { data: any }) => ReturnType;
			unsetComment: () => ReturnType;
		};
	}
}

const Comment = Mark.create({
	name: "comment",
	priority: 1000,
	keepOnSplit: false,

	addOptions() {
		return {};
	},

	addAttributes() {
		return { comment: { default: null }, answers: { default: null }, count: { default: null } };
	},

	parseHTML() {
		return [{ tag: "comment-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		const dom = document.createElement("comment-react-component");

		for (const [key, value] of Object.entries(HTMLAttributes)) {
			dom.setAttribute(key, value);
		}

		dom.setAttribute("data-qa", "qa-comment");

		dom.addEventListener("click", (e: MouseEvent) => {
			e.stopPropagation();
			eventEmitter.emit("onClickComment", { dom });
		});

		return { dom, contentDOM: dom };
	},

	addCommands() {
		return {
			toggleComment:
				(attributes) =>
				({ chain, editor, state, view }) => {
					if (!getSelectedText(state)) return false;

					const callback = () => {
						eventEmitter.emit("addComment", { pos: editor.state.tr.selection.to - 1, view });
						offEditor();
					};

					function offEditor() {
						editor.off("update", callback);
					}

					editor.on("update", callback);

					return chain()
						.toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
						.focus(editor.state.tr.selection.to - 1)
						.run();
				},
			unsetComment:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("handleClickComment"),
				view: (editorView) => {
					return new CommentFocusTooltip(
						editorView,
						this.editor,
						this.options.theme,
						this.options.apiUrlCreator,
						this.options.pageDataContext,
					);
				},
			}),
		];
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[{ key: "Space", focusShouldBeInsideNode: false, rules: [space("unsetComment")] }],
			this.type.name,
		);
	},
});

export default Comment;
