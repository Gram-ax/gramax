import { CommentOptions, CommentStorage } from "@ext/markdown/elements/comment/edit/model/types";
import { Editor, MarkConfig, ParentConfig, Range } from "@tiptap/core";
import { MarkType, Node } from "@tiptap/pm/model";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { AddMarkStep, AttrStep, RemoveMarkStep } from "@tiptap/pm/transform";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const processCommentPositions = (doc: Node): Map<string, Range[]> => {
	const commentPositions: Map<string, Range[]> = new Map();

	doc.descendants((node, pos) => {
		node.marks.forEach((mark) => {
			if (mark.type.name === "comment") {
				if (!commentPositions.has(mark.attrs.id)) commentPositions.set(mark.attrs.id, []);
				commentPositions.get(mark.attrs.id)?.push({ from: pos, to: pos + node.nodeSize });
			}
		});

		if ((node.isBlock || node.isInline) && node.attrs.comment?.id) {
			if (!commentPositions.has(node.attrs.comment.id)) commentPositions.set(node.attrs.comment.id, []);
			commentPositions.get(node.attrs.comment.id)?.push({ from: pos, to: pos + node.nodeSize });
		}
	});

	return commentPositions;
};

function StateWatcher(this: {
	name: string;
	options: CommentOptions;
	storage: CommentStorage;
	editor: Editor;
	type: MarkType;
	parent: ParentConfig<MarkConfig<CommentOptions, CommentStorage>>["addProseMirrorPlugins"];
}) {
	const { onMarkDeleted, onMarkAdded } = this.options;

	const updateCommentPositions = (tr: Transaction) => {
		if (!tr.docChanged) return null;

		const updatedPositions: Map<string, Range[]> = new Map(this.storage.positions);
		const deletedComments = new Set<string>();
		const addedComments: Map<string, Range[]> = new Map();
		const isHistoryStep = tr.getMeta("history$");

		tr.steps.forEach((step) => {
			if (step instanceof AddMarkStep && step.mark.type.name === "comment") {
				const commentId = step.mark.attrs.id;
				if (!commentId) return;
				if (!addedComments.has(commentId)) addedComments.set(commentId, []);
				addedComments.get(commentId)?.push({ from: step.from, to: step.to });
			}

			if (step instanceof RemoveMarkStep && step.mark.type.name === "comment") {
				const commentId = step.mark.attrs.id;
				if (!commentId) return;
				deletedComments.add(commentId);

				if (updatedPositions.has(commentId)) {
					updatedPositions.get(commentId)?.filter(({ from, to }) => !(from >= step.from && to <= step.to));
					if (updatedPositions.get(commentId)?.length === 0) updatedPositions.delete(commentId);
				}
			}

			if (step instanceof AttrStep) {
				const node = tr.doc.nodeAt(step.pos);
				const oldNode = tr.before.nodeAt(step.pos);

				if ((node.isBlock || node.isInline) && !node.isTextblock && step.attr === "comment") {
					const commentId = oldNode?.attrs?.comment?.id || node.attrs.comment?.id;
					if (!commentId) return;

					if (step.value) {
						if (!addedComments.has(commentId)) addedComments.set(commentId, []);
						addedComments.get(commentId)?.push({ from: step.pos, to: step.pos + node.nodeSize });
					} else {
						const oldCommentId = oldNode?.attrs.comment?.id;
						deletedComments.add(oldCommentId);

						if (updatedPositions.has(oldCommentId)) {
							updatedPositions
								.get(oldCommentId)
								?.filter(({ from, to }) => !(from >= step.pos && to <= step.pos + node.nodeSize));

							if (updatedPositions.get(oldCommentId)?.length === 0) updatedPositions.delete(oldCommentId);
						}
					}
				}
			}
		});

		if (isHistoryStep) {
			const restoredPositions = processCommentPositions(tr.doc);

			restoredPositions.forEach((positions, commentId) => {
				if (!updatedPositions.has(commentId) || updatedPositions.get(commentId)?.length === 0) {
					if (!addedComments.has(commentId)) addedComments.set(commentId, []);
					addedComments.get(commentId)?.push(...positions);
					updatedPositions.set(commentId, [...positions]);
					deletedComments.delete(commentId);
				}
			});

			updatedPositions.forEach((positions, commentId) => {
				if (!restoredPositions.has(commentId)) {
					deletedComments.add(commentId);
					updatedPositions.delete(commentId);
				}
			});
		}

		if (updatedPositions.size > 0) {
			tr.steps.forEach((step) => {
				const stepMap = step.getMap();

				stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
					const oldSize = oldEnd - oldStart;
					const newSize = newEnd - newStart;
					const sizeDiff = newSize - oldSize;

					updatedPositions.forEach((positions, commentId) => {
						if (deletedComments.has(commentId)) return;

						updatedPositions.set(
							commentId,
							positions
								.map(({ from, to }) => {
									// TODO: find a better way to handle this
									if (from >= oldEnd) {
										return {
											from: from + sizeDiff,
											to: to + sizeDiff,
										};
									} else if (from < oldStart && to > oldStart) {
										return {
											from,
											to: to + sizeDiff,
										};
									} else if (from >= oldStart && to <= oldEnd) {
										if (newSize === 0) {
											deletedComments.add(commentId);
											return null;
										}
										return {
											from: Math.max(from, newStart),
											to: Math.min(to + sizeDiff, newEnd),
										};
									} else return { from, to };
								})
								.filter(Boolean) as Range[],
						);
					});
				});
			});
		}

		deletedComments.forEach((commentId) => onMarkDeleted?.(commentId, updatedPositions.get(commentId) || []));
		addedComments.forEach((positions, commentId) => {
			updatedPositions.set(commentId, [...positions]);
			onMarkAdded?.(commentId, positions);
		});

		Object.keys(updatedPositions).forEach((commentId) => {
			const positions = updatedPositions.get(commentId);
			if (!positions?.length) {
				deletedComments.add(commentId);
				updatedPositions.delete(commentId);
			}
		});

		deletedComments.forEach((commentId) => updatedPositions.delete(commentId));

		this.editor.storage.comment.positions = updatedPositions;
	};

	this.editor.storage.comment.positions = processCommentPositions(this.editor.state.doc);

	const addDecorations = (state: EditorState, from: number, to: number, decorations: Decoration[]) => {
		const node = state.doc.nodeAt(from);
		if (node.isBlock) decorations.push(Decoration.node(from, to, { class: "active" }));
		else if (node.isInline) decorations.push(Decoration.inline(from, to, { class: "active" }));
	};

	return new Plugin({
		key: new PluginKey("commentStateWatcher$"),
		appendTransaction(transactions) {
			transactions.forEach((tr) => updateCommentPositions(tr));
			return null;
		},
		props: {
			decorations: (state) => {
				//temp
				const isDiffEditor = this.editor.extensionStorage.diff;
				if (isDiffEditor) return null;

				const { hoverComment, openedComment, positions } = this.editor.storage.comment;
				const decorations: Decoration[] = [];

				if (hoverComment && positions.get(hoverComment)) {
					positions
						.get(hoverComment)
						?.forEach(({ from, to }) => addDecorations(state, from, to, decorations));
				}

				if (openedComment?.id && positions.get(openedComment.id)) {
					positions
						.get(openedComment.id)
						?.forEach(({ from, to }) => addDecorations(state, from, to, decorations));
				}

				positions.forEach((ranges) => {
					ranges.forEach(({ from, to }) => {
						const node = state.doc.nodeAt(from);
						if (!node || node.isText || !node.isBlock) return;
						decorations.push(Decoration.node(from, to, { class: "has-comment" }));
					});
				});

				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
}

export default StateWatcher;
