import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark, Range } from "@tiptap/core";
import CommentBlockMark from "@ext/markdown/elements/comment/edit/logic/BlockMark";
import StateWatcher from "@ext/markdown/elements/comment/edit/logic/utils/StateWatcher";
import { CommentOptions, CommentStorage } from "@ext/markdown/elements/comment/edit/model/types";
import { COMMENT_BLOCK_NODE_TYPES } from "@ext/markdown/elements/comment/edit/model/consts";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		comment: {
			toggleComment: (attributes: { id: string }, positions: Range) => ReturnType;
			closeComment: () => ReturnType;
			openComment: (id: string, position: Range) => ReturnType;
			hoverComment: (id: string) => ReturnType;
			unsetComment: () => ReturnType;
			unsetCurrentComment: () => ReturnType;
			unhoverComment: () => ReturnType;
		};
	}

	interface Storage {
		comment: CommentStorage;
	}
}

const Comment = Mark.create<CommentOptions, CommentStorage>({
	name: "comment",
	priority: 1000,
	keepOnSplit: false,

	addOptions() {
		return {
			onMarkDeleted: null,
			onMarkAdded: null,
		};
	},

	inclusive() {
		return false;
	},

	addStorage() {
		return {
			openedComment: null,
			hoverComment: null,
			positions: new Map<string, Range[]>(),
		};
	},

	addAttributes() {
		return {
			id: { default: null },
		};
	},

	addGlobalAttributes() {
		return [
			{
				// We can't use "*" or "all" because TipTap doesn't support it. Need to add types manually.
				types: COMMENT_BLOCK_NODE_TYPES,
				attributes: {
					comment: {
						default: {
							id: null,
						},
						rendered: false,
						isRequired: false,
					},
				},
			},
		];
	},

	parseHTML() {
		return [{ tag: "comment-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		const dom = document.createElement("span");
		dom.setAttribute("data-qa", "qa-comment");
		dom.setAttribute("data-comment-id", HTMLAttributes.id);
		dom.setAttribute("data-comment", "true");

		dom.addEventListener("mouseenter", () => {
			this.editor.commands.hoverComment(HTMLAttributes.id);
		});

		dom.addEventListener("mouseleave", () => {
			this.editor.commands.unhoverComment();
		});

		dom.addEventListener("click", () => {
			const posAtDom = this.editor.view.posAtDOM(dom, 0);
			if (!posAtDom) return;

			const $pos = this.editor.state.doc.resolve(posAtDom);
			this.editor.commands.openComment(HTMLAttributes.id, {
				from: posAtDom,
				to: posAtDom + $pos.nodeAfter.nodeSize,
			});
		});

		return { dom, contentDOM: dom };
	},

	addCommands() {
		return {
			toggleComment:
				(attributes, position) =>
				({ chain }) => {
					return chain()
						.command(({ tr, dispatch }) => {
							const blockMark = new CommentBlockMark(tr, this.type);
							const newTr = blockMark.setMarkup(tr.selection, attributes);
							dispatch?.(newTr);
							return true;
						})
						.openComment(attributes.id, position)
						.run();
				},
			unsetComment:
				() =>
				({ commands }) => {
					return commands.command(({ tr, dispatch }) => {
						const blockMark = new CommentBlockMark(tr, this.type);
						const newTr = blockMark.deleteMarkup(tr.selection);
						dispatch?.(newTr);
						return true;
					});
				},
			openComment:
				(id: string, position: Range) =>
				({ commands }) => {
					return commands.command(() => {
						this.storage.openedComment = { id, position };
						return true;
					});
				},
			hoverComment:
				(id: string) =>
				({ commands }) => {
					return commands.command(() => {
						this.storage.hoverComment = id;
						return true;
					});
				},
			closeComment:
				() =>
				({ commands }) => {
					return commands.command(() => {
						this.storage.openedComment = null;
						return true;
					});
				},
			unhoverComment:
				() =>
				({ commands }) => {
					return commands.command(() => {
						this.storage.hoverComment = null;
						return true;
					});
				},
			unsetCurrentComment:
				() =>
				({ commands }) => {
					return commands.command(({ tr, dispatch, state }) => {
						const openedCommentId = this.storage?.openedComment?.id;
						if (!openedCommentId) return true;

						const blockMark = new CommentBlockMark(tr, state.schema.marks.comment);
						const markPositions = this.storage.positions?.get(openedCommentId);
						if (!markPositions) return true;

						this.storage.openedComment = null;
						if (this.storage.hoverComment === openedCommentId) this.storage.hoverComment = null;

						tr = blockMark.deleteMarkup(markPositions);
						dispatch(tr);
						return true;
					});
				},
		};
	},

	addProseMirrorPlugins() {
		return [StateWatcher.bind(this)()];
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[{ key: "Space", focusShouldBeInsideNode: false, rules: [space("unsetComment", this.type.name)] }],
			this.type.name,
		);
	},
});

export default Comment;
