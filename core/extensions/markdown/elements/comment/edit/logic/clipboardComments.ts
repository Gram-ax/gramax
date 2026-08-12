import type { CommentBlock } from "@core-ui/CommentBlock";
import type { Fragment, Node } from "@tiptap/pm/model";

export type CommentBodies = Map<string, CommentBlock>;

export type ClipboardComments = Record<string, CommentBlock>;

const collectIds = (fragment: Fragment): Set<string> => {
	const ids = new Set<string>();

	const walk = (node: Node) => {
		const mark = node.marks.find((mark) => mark.type.name === "comment");
		if (mark?.attrs.id) ids.add(mark.attrs.id);
		if (node.attrs?.comment?.id) ids.add(node.attrs.comment.id);

		node.content.forEach(walk);
	};

	fragment.forEach(walk);
	return ids;
};

export const collectClipboardComments = (fragment: Fragment, comments: CommentBodies): ClipboardComments => {
	const result: ClipboardComments = {};
	if (!comments?.size) return result;

	for (const id of collectIds(fragment)) {
		const body = comments.get(id);
		if (body) result[id] = body;
	}

	return result;
};
