import headingPasteFormatter from "@ext/markdown/elements/heading/edit/logic/headingPasteFormatter";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import { Fragment, type Node, Slice } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";

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

export const transformPastedHTML = (html: string): string => {
	return html?.replaceAll("[object Object]", "");
};

export const transformPastedText = (text: string): string => {
	return text
		.split("\n")
		.map((line) => line.trimStart())
		.join("\n");
};

export const transformPasted = (slice: Slice, state: EditorState): Slice => {
	const headingAllowed = readyToPlace(state, "heading");
	if (headingAllowed) return slice;

	return new Slice(
		mapFragment(slice.content, (node) => {
			if (node.type.name !== "heading") return node;
			return headingPasteFormatter(state, node);
		}),
		slice.openStart,
		slice.openEnd,
	);
};
