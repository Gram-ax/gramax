import { CommentOptions, CommentStorage } from "@ext/markdown/elements/comment/edit/model/types";
import {
	ChangedRange,
	Editor,
	MarkConfig,
	ParentConfig,
	Range,
	combineTransactionSteps,
	getChangedRanges,
} from "@tiptap/core";
import { MarkType, Node } from "@tiptap/pm/model";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { AddMarkStep, AttrStep, RemoveMarkStep, Transform } from "@tiptap/pm/transform";
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

const processEmptyRanges = (tr: Transform, changes: ChangedRange[]) => {
	tr.steps.forEach((step) => {
		if (step instanceof AddMarkStep && step.mark.type.name === "comment") {
			changes.push({ oldRange: { from: step.from, to: step.to }, newRange: { from: step.from, to: step.to } });
		}

		if (step instanceof RemoveMarkStep && step.mark.type.name === "comment") {
			changes.push({ oldRange: { from: step.from, to: step.to }, newRange: { from: step.from, to: step.to } });
		}

		if (step instanceof AttrStep) {
			changes.push({
				oldRange: { from: step.pos, to: step.pos + 1 },
				newRange: { from: step.pos, to: step.pos + 1 },
			});
		}
	});
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

	const updateCommentPositions = (transactions: Transaction[], oldDoc: Node, newDoc: Node) => {
		const tr = combineTransactionSteps(oldDoc, transactions);
		const changes = [...(getChangedRanges(tr) || [])];

		const currentPositions = new Map(this.storage.positions);
		const deletedComments = new Set<string>();
		const addedComments = new Map<string, Range[]>();
		processEmptyRanges(tr, changes);

		if (changes.length === 0) return;

		currentPositions.forEach((ranges, commentId) => {
			const updatedRanges: Range[] = [];

			ranges.forEach((range) => {
				let newFrom = range.from;
				let newTo = range.to;
				let isDeleted = false;

				changes.forEach(({ oldRange, newRange }) => {
					const sizeDiff = newRange.to - newRange.from - (oldRange.to - oldRange.from);

					if (range.from >= oldRange.to) {
						newFrom += sizeDiff;
						newTo += sizeDiff;
					} else if (range.from < oldRange.from && range.to > oldRange.from) {
						newTo += sizeDiff;
					} else if (range.from >= oldRange.from && range.to <= oldRange.to) {
						isDeleted = true;
					}
				});

				if (!isDeleted) {
					updatedRanges.push({ from: newFrom, to: newTo });
				}
			});

			if (updatedRanges.length === 0) {
				currentPositions.delete(commentId);
				deletedComments.add(commentId);
			} else currentPositions.set(commentId, updatedRanges);
		});

		changes.forEach(({ newRange }) => {
			newDoc.nodesBetween(newRange.from, newRange.to, (node, pos) => {
				node.marks.forEach((mark) => {
					if (mark.type.name === "comment" && mark.attrs.id) {
						const commentId = mark.attrs.id;
						const range = { from: pos, to: pos + node.nodeSize };

						if (!currentPositions.has(commentId)) {
							currentPositions.set(commentId, [range]);
							addedComments.set(commentId, [range]);
							deletedComments.delete(commentId);
						} else {
							const existingRanges = currentPositions.get(commentId);
							if (existingRanges) {
								const rangeExists = existingRanges.some(
									(existingRange) =>
										existingRange.from === range.from && existingRange.to === range.to,
								);

								if (!rangeExists) {
									const updatedRanges = [...existingRanges, range];
									currentPositions.set(commentId, updatedRanges);
									if (!addedComments.has(commentId)) {
										addedComments.set(commentId, updatedRanges);
									}
								}
							}
						}
					}
				});

				if ((node.isBlock || node.isInline) && node.attrs.comment?.id) {
					const commentId = node.attrs.comment.id;
					const range = { from: pos, to: pos + node.nodeSize };

					if (!currentPositions.has(commentId)) {
						currentPositions.set(commentId, [range]);
						addedComments.set(commentId, [range]);
						deletedComments.delete(commentId);
					} else {
						const existingRanges = currentPositions.get(commentId);
						if (existingRanges) {
							const rangeExists = existingRanges.some(
								(existingRange) => existingRange.from === range.from && existingRange.to === range.to,
							);

							if (!rangeExists) {
								const updatedRanges = [...existingRanges, range];
								currentPositions.set(commentId, updatedRanges);
								if (!addedComments.has(commentId)) {
									addedComments.set(commentId, updatedRanges);
								}
							}
						}
					}
				}
			});
		});

		deletedComments.forEach((commentId) => {
			onMarkDeleted?.(commentId, []);
		});

		addedComments.forEach((positions, commentId) => {
			onMarkAdded?.(commentId, positions);
		});

		this.storage.positions = currentPositions;
	};

	this.editor.storage.comment.positions = processCommentPositions(this.editor.state.doc);

	const addDecorations = (state: EditorState, from: number, to: number, decorations: Decoration[]) => {
		const node = state.doc.nodeAt(from);
		if (node.isBlock) decorations.push(Decoration.node(from, to, { class: "active" }));
		else if (node.isInline) decorations.push(Decoration.inline(from, to, { class: "active" }));
	};

	return new Plugin({
		key: new PluginKey("commentStateWatcher$"),
		appendTransaction(transactions, oldState, newState) {
			updateCommentPositions(transactions as Transaction[], oldState.doc, newState.doc);
			return null;
		},
		props: {
			decorations: (state) => {
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
