import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@ext/markdown/elements/paragraph/edit/model/paragraph";
import Text from "@tiptap/extension-text";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import Drawio from "@ext/markdown/elements/drawio/edit/model/drawio";

describe("Comment State Watcher", () => {
	let editor: Editor;
	let onMarkAdded: jest.Mock;
	let onMarkDeleted: jest.Mock;

	beforeEach(() => {
		onMarkAdded = jest.fn();
		onMarkDeleted = jest.fn();
		editor = new Editor({
			content: "<p>test</p><drawio-react-component src='test'></drawio-react-component>",
			extensions: [
				Document,
				Drawio,
				Paragraph,
				Text,
				Comment.configure({
					onMarkAdded,
					onMarkDeleted,
				}),
			],
		});

		// @ts-expect-error editor is not typed
		editor.extensionManager.extensions[1].editor = editor;
		// @ts-expect-error type is not typed
		editor.extensionManager.extensions[1].type = editor.schema.marks.comment;
	});

	it("add comment position", () => {
		const { state, view } = editor;
		const commentId = "c1";
		const mark = editor.schema.marks.comment.create({ id: commentId });
		const tr = state.tr.addMark(1, 5, mark);
		view.dispatch(tr);

		const positions = editor.storage.comment.positions.get(commentId);
		expect(positions).toBeDefined();
		expect(positions[0].from).toBe(1);
		expect(positions[0].to).toBe(5);
		expect(onMarkAdded).toHaveBeenCalledWith(commentId, positions);
	});

	it("delete comment position", () => {
		const { state, view } = editor;
		const commentId = "c2";
		const mark = editor.schema.marks.comment.create({ id: commentId });
		let tr = state.tr.addMark(1, 5, mark);
		view.dispatch(tr);
		tr = view.state.tr.removeMark(1, 5, editor.schema.marks.comment);
		view.dispatch(tr);

		const positions = editor.storage.comment.positions.get(commentId);
		expect(positions).toBeUndefined();
		const calls = onMarkDeleted.mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const [deletedId, deletedPositions] = calls[0];
		expect(deletedId).toBe(commentId);
		expect(Array.isArray(deletedPositions)).toBe(true);
		if (deletedPositions.length > 0) {
			expect(deletedPositions[0]).toHaveProperty("from");
			expect(deletedPositions[0]).toHaveProperty("to");
		}
	});

	it("add block comment through AttrStep", () => {
		const { state, view } = editor;
		const commentId = "block1";
		let pos = 0;
		state.doc.descendants((node, position) => {
			if (node.type.name === "drawio" && pos === 0) {
				pos = position;
			}
		});
		const node = state.doc.nodeAt(pos);
		const tr = state.tr.setNodeAttribute(pos, "comment", { id: commentId });
		view.dispatch(tr);

		const positions = editor.storage.comment.positions.get(commentId);
		expect(positions).toBeDefined();
		expect(positions[0].from).toBe(pos);
		expect(positions[0].to).toBe(pos + node.nodeSize);
		expect(onMarkAdded).toHaveBeenCalledWith(commentId, positions);
	});

	it("delete block comment through AttrStep", () => {
		const { state, view } = editor;
		const commentId = "block2";
		let pos = 0;
		state.doc.descendants((node, position) => {
			if (node.type.name === "drawio" && pos === 0) {
				pos = position;
			}
		});
		let tr = state.tr.setNodeAttribute(pos, "comment", { id: commentId });
		view.dispatch(tr);
		tr = view.state.tr.setNodeAttribute(pos, "comment", null);
		view.dispatch(tr);

		const positions = editor.storage.comment.positions.get(commentId);
		expect(positions).toBeUndefined();
		const calls = onMarkDeleted.mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const [deletedId, deletedPositions] = calls[calls.length - 1];
		expect(deletedId).toBe(commentId);
		if (deletedPositions.length > 0) {
			expect(deletedPositions[0]).toHaveProperty("from");
			expect(deletedPositions[0]).toHaveProperty("to");
		}
	});

	it("correctly works with multiple comments", () => {
		const { state, view } = editor;
		const mark1 = editor.schema.marks.comment.create({ id: "c1" });
		const mark2 = editor.schema.marks.comment.create({ id: "c2" });
		view.dispatch(state.tr.addMark(1, 3, mark1));
		view.dispatch(view.state.tr.addMark(3, 5, mark2));

		const pos1 = editor.storage.comment.positions.get("c1");
		const pos2 = editor.storage.comment.positions.get("c2");

		expect(pos1).toBeDefined();
		expect(pos2).toBeDefined();
		expect(pos1[0].from).toBe(1);
		expect(pos1[0].to).toBe(3);
		expect(pos2[0].from).toBe(3);
		expect(pos2[0].to).toBe(5);
	});

	it("onMarkDeleted is not called if comment is not deleted", () => {
		const { state, view } = editor;
		const commentId = "notDeleted";
		const mark = editor.schema.marks.comment.create({ id: commentId });
		view.dispatch(state.tr.addMark(1, 5, mark));
		expect(onMarkDeleted).not.toHaveBeenCalled();
	});
});
