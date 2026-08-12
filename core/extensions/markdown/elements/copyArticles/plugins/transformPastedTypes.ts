import headingPasteFormatter from "@ext/markdown/elements/heading/edit/logic/headingPasteFormatter";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import { Fragment, type Node, Slice } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

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
	const document = new DOMParser().parseFromString(html.replaceAll("[object Object]", ""), "text/html");
	const contentElementSelector = "img, audio, video, iframe, object, embed, svg, canvas, input, hr";
	const blockElementSelector =
		"address, article, aside, blockquote, canvas, dd, div, dl, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hgroup, hr, li, noscript, ol, output, p, pre, section, table, tfoot, ul";

	const removeEmptyElements = (parent: Element) => {
		for (const child of Array.from(parent.childNodes)) {
			if (!(child instanceof Element)) continue;

			removeEmptyElements(child);

			const textContent = child.textContent ?? "";
			const hasEmbeddedContent =
				child.matches(contentElementSelector) || child.querySelector(contentElementSelector);
			const isEmpty =
				!hasEmbeddedContent && (!textContent || (!textContent.trim() && child.matches(blockElementSelector)));
			if (isEmpty) child.remove();
		}
	};

	removeEmptyElements(document.body);
	return document.body.innerHTML;
};

export const transformPastedText = (text: string, _: boolean, view: EditorView): string => {
	const { $from } = view.state.selection;
	const parent = $from?.parent;

	if (parent?.type?.spec?.code) return text;

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
