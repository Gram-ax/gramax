import { Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import CommentFocusTooltip from "../logic/CommentFocusTooltip";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import space from "@ext/markdown/logic/keys/marks/space";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";

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
		return {}
	},

	addAttributes() {
		return { comment: { default: null }, answers: { default: null }, count: { default: null } };
	},

	parseHTML() {
		return [{ tag: "comment-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["comment-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addCommands() {
		return {
			toggleComment:
				(attributes) =>
				({ chain, editor, state }) => {
					if (!getSelectedText(state)) return false;
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
