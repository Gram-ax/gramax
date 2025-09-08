import { Range } from "@tiptap/core";
import { Attrs, MarkType, Node } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";

interface BlockMarkInterface {
	setMarkup(range: Range, attributes: Attrs): Transaction;
	deleteMarkup(range: Range): Transaction;
}

type ElementType = "text";

type CommentPosition = {
	type: ElementType;
	from: number;
	to: number;
};

export interface BlockMarkData {
	data: Attrs;
	position: number;
	isFromBlock: boolean;
	range: Range;
}

class CommentBlockMark implements BlockMarkInterface {
	constructor(private readonly _tr: Transaction, private readonly _markType: MarkType) {}

	static getCommentPosition(doc: Node, commentId: string): CommentPosition[] {
		const commentMarksWithRange: CommentPosition[] = [];

		doc.descendants((node, pos) => {
			const commentMark = node.marks.find((mark) => mark.type.name === "comment" && mark.attrs.id === commentId);
			if (!commentMark) return;

			commentMarksWithRange.push({
				type: "text",
				from: pos,
				to: pos + node.nodeSize,
			});
		});

		return commentMarksWithRange;
	}

	setMarkup(range: Range, attributes: Attrs) {
		return this._set(range, attributes);
	}

	deleteMarkup(range: Range | Range[]) {
		if (Array.isArray(range)) {
			range.forEach((r) => r && this._delete(r));
			return this._tr;
		}

		return this._delete(range);
	}

	private _delete(range: Range) {
		this._tr.doc.nodesBetween(range.from, range.to, (node, pos) => {
			const clampedFrom = Math.max(pos, range.from);
			const clampedTo = Math.min(pos + node.nodeSize, range.to);

			if (node.isText) return this._deleteTextAttributes(this._tr, { from: clampedFrom, to: clampedTo });
			if ((node.isBlock || node.isInline) && !node.isTextblock) return this._deleteBlockAttributes(this._tr, pos);
		});

		return this._tr;
	}

	private _set(range: Range, attributes: Attrs) {
		this._tr.doc.nodesBetween(range.from, range.to, (node, pos) => {
			const clampedFrom = Math.max(pos, range.from);
			const clampedTo = Math.min(pos + node.nodeSize, range.to);

			if (node.isText) return this._setTextAttributes(this._tr, { from: clampedFrom, to: clampedTo }, attributes);
			if ((node.isBlock || node.isInline) && !node.isTextblock)
				return this._setBlockAttributes(this._tr, pos, attributes);
		});

		return this._tr;
	}

	private _setBlockAttributes(tr: Transaction, pos: number, attributes: Attrs) {
		const newNode = tr.doc.nodeAt(pos);
		if (newNode?.isText || newNode?.isTextblock) return;
		tr.setNodeAttribute(pos, this._markType.name, attributes);
	}

	private _deleteBlockAttributes(tr: Transaction, pos: number) {
		const newNode = tr.doc.nodeAt(pos);
		if (newNode?.isText || newNode?.isTextblock) return;
		tr.setNodeAttribute(pos, this._markType.name, undefined);
	}

	private _setTextAttributes(tr: Transaction, range: Range, attributes: Attrs) {
		tr.addMark(range.from, range.to, this._markType.create(attributes));
	}

	private _deleteTextAttributes(tr: Transaction, range: Range) {
		tr.removeMark(range.from, range.to, this._markType);
	}
}

export default CommentBlockMark;
