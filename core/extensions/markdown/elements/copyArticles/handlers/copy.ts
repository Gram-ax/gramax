import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import createPlainText from "@ext/markdown/elements/copyArticles/createPlainText";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { JSONContent } from "@tiptap/core";
import { DOMSerializer, Fragment, Node, Schema } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";

interface CreatedFragment {
	fragment: Fragment;
	plainText: string;
	deleteRange?: { from: number; to: number };
}

export interface GramaxClipboardData {
	copyPath: string;
	range: { from: number; to: number };
	data: JSONContent;
}

export interface CopyOptions {
	cut?: boolean;
}

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

const isTitle = (view: EditorView, fragment: Fragment): boolean => {
	const firstNode = view.state.doc.firstChild;
	const firstFragment = fragment.firstChild;
	return firstNode === firstFragment;
};

const createTitleNode = (view: EditorView, fragment: Fragment): Node => {
	const node = fragment.firstChild;
	if (!node) return null;
	return view.state.schema.nodes.heading.create(null, node.content);
};

const createTitleHTML = (view: EditorView, fragment: Fragment) => {
	const node = fragment.firstChild;
	if (!node) return null;
	return DOMSerializer.fromSchema(view.state.schema).serializeNode(createTitleNode(view, fragment));
};

const getImageFromFragment = (fragment: Fragment, resourceService: ResourceServiceType): boolean => {
	const firstImage =
		fragment.firstChild?.type?.name === "image" || fragment.firstChild?.type?.name === "inlineImage"
			? fragment.firstChild
			: null;

	if (!firstImage) return false;
	const buffer = resourceService.getBuffer(firstImage.attrs.src);
	if (!buffer) return false;

	const mimeType = resolveFileKind(buffer);
	if (!mimeType || !IMAGE_MIME_TYPES.includes(mimeType) || mimeType === "image/svg+xml") return false;

	void navigator.clipboard.write([
		new ClipboardItem({
			[mimeType]: new Blob([buffer], { type: mimeType }),
		}),
	]);

	return true;
};

const createNodesJSON = (editor: EditorView, fragment: Fragment, getBuffer: (src: string) => Buffer): string[] => {
	const nodes: string[] = [];

	const processNode = (node: Node): Node => {
		const { attrs, content, marks } = {
			attrs: { ...node.attrs },
			content: node.content,
			marks: node.marks,
		};

		if (node.attrs.src) {
			attrs.resource = {
				...attrs,
				name: attrs.src,
				src: getBuffer(attrs.src),
			};
		}

		if (node.isText) {
			return editor.state.schema.text(
				node.text,
				marks.filter((m) => m.type.name !== "file"),
			);
		} else {
			const newContent = [];
			if (content && content.size > 0) {
				content.forEach((node: Node) => {
					newContent.push(processNode(node));
				});
			}

			const jsonNode = node.type.create(attrs, newContent, marks);
			return jsonNode;
		}
	};

	fragment.forEach((node: Node, index: number) => {
		if (index === 0 && isTitle(editor, fragment)) nodes.push(createTitleNode(editor, fragment).toJSON());
		else nodes.push(processNode(node).toJSON());
	});

	return nodes;
};

const createGramaxClipboardData = (
	view: EditorView,
	fragment: Fragment,
	articleProps: ClientArticleProps,
	resourceService: ResourceServiceType,
): GramaxClipboardData => {
	const { $from, $to } = view.state.selection;

	return {
		copyPath: articleProps?.logicPath || "",
		range: { from: $from.pos, to: $to.pos },
		data: createNodesJSON(view, fragment, resourceService.getBuffer),
	};
};

const createTableFragment = (content: Fragment, schema: Schema<any, any>): CreatedFragment => {
	const tableFragment =
		content.firstChild.type.name === "table"
			? content
			: Fragment.empty.addToStart(schema.nodes.table.create(null, content));
	return {
		fragment: tableFragment,
		plainText: tableFragment.textBetween(0, tableFragment.size, "\n"),
	};
};

const createCodeBlockFragment = (content: Fragment, schema: Schema): Fragment => {
	return Fragment.fromArray(
		content.firstChild.text.split("\n").reduce((acc: Node[], text) => {
			if (text.length > 0) {
				acc.push(schema.nodes.paragraph.create(null, schema.text(text, [])));
			}
			return acc;
		}, []),
	);
};

const createFragment = (view: EditorView): CreatedFragment => {
	const { $from, $to, ranges } = view.state.selection;
	const { doc, schema } = view.state;
	const parent = $from.node($from.depth - 2);
	const parentName = parent?.type?.name;
	const slice = doc.slice($from.pos, $to.pos);
	const range = window.getSelection()?.getRangeAt(0);

	const text = createPlainText(range);
	const fromNode = $from.node();
	const isSameNode = fromNode === $to.node();
	if (isSameNode && fromNode.type.spec.code) {
		return {
			fragment: createCodeBlockFragment(slice.content, schema),
			plainText: text,
		};
	}

	if (parentName === "table" && ranges.length > 1)
		return createTableFragment(view.state.selection.content().content, schema);

	if (parentName === "doc" && $from.pos === doc.firstChild.nodeSize && $to.pos === doc.content.size)
		return {
			fragment: doc.slice(doc.firstChild.nodeSize, doc.content.size, true).content,
			plainText: text,
		};

	if (slice.content?.firstChild?.type?.name === "listItem") {
		const parent = (parentName === "doc" && $from.node($from.depth - 1)) || $from.node($from.depth - 2);
		return {
			fragment: Fragment.from(parent.copy(slice.content)),
			plainText: text,
			deleteRange: { from: $from.pos - 2, to: $to.pos },
		};
	}

	return { fragment: slice.content, plainText: text };
};

const getSerializedHTML = (view: EditorView, fragment: Fragment): string => {
	const div = document.createElement("div");
	const serializedElement = DOMSerializer.fromSchema(view.state.schema).serializeFragment(fragment);
	div.appendChild(serializedElement);

	if (isTitle(view, fragment)) {
		const titleHTML = createTitleHTML(view, fragment);
		div.firstElementChild.replaceWith(titleHTML);
	}

	return new XMLSerializer().serializeToString(div);
};

const getNodesData = (
	view: EditorView,
	articleProps: ClientArticleProps,
	resourceService: ResourceServiceType,
): { copyTypes: Record<string, string>; deleteRange: { from: number; to: number } } => {
	const { fragment, plainText, deleteRange } = createFragment(view);
	const imageData = getImageFromFragment(fragment, resourceService);
	if (imageData) return;

	return {
		copyTypes: {
			"text/gramax": JSON.stringify(createGramaxClipboardData(view, fragment, articleProps, resourceService)),
			"text/plain": plainText,
			"text/html": getSerializedHTML(view, fragment),
		},
		deleteRange,
	};
};

export const copy = (
	view: EditorView,
	event: ClipboardEvent,
	articleProps: ClientArticleProps,
	resourceService: ResourceServiceType,
	options?: CopyOptions,
) => {
	const { from, to } = view.state.selection;
	const { tr } = view.state;
	if (from === to) return;

	const data = getNodesData(view, articleProps, resourceService);
	if (data) Object.entries(data.copyTypes).forEach(([type, data]) => event.clipboardData.setData(type, data));

	if (options?.cut) {
		if (data?.deleteRange) {
			const clampedFrom = Math.max(Math.min(data.deleteRange.from, view.state.doc.content.size), 0);
			const clampedTo = Math.max(Math.min(data.deleteRange.to, view.state.doc.content.size), 0);
			tr.deleteRange(clampedFrom, clampedTo);
		} else tr.deleteSelection();
		view.dispatch(tr);
	}
};
