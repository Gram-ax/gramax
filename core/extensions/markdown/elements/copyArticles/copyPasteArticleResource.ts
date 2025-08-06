import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import createPlainText from "@ext/markdown/elements/copyArticles/createPlainText";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import { Attrs, DOMSerializer, Fragment, Mark, Node as ProseMirrorNode, Schema, Slice } from "@tiptap/pm/model";
import { Selection, Transaction } from "@tiptap/pm/state";
import { handlePaste } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import headingPasteFormatter from "@ext/markdown/elements/heading/edit/logic/headingPasteFormatter";

interface CreateProps {
	node: ProseMirrorNode;
	view: EditorView;
	event: ClipboardEvent;
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
	tr: Transaction;
}
interface FilterProps {
	view: EditorView;
	node: ProseMirrorNode;
	attrs: [] | Attrs;
	headingAllowed: boolean;
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
}

interface PasteProps {
	view: EditorView;
	event: ClipboardEvent;
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
}

interface CreatedFragment {
	fragment: Fragment;
	plainText: string;
	deleteRange?: { from: number; to: number };
}

type ClipboardItems = Record<string, string>;
const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

const handleCommentary = (view: EditorView, marks: Mark[] | readonly Mark[]): Mark[] | readonly Mark[] => {
	const newMarks: Mark[] = [];
	const { doc } = view.state;

	marks.forEach((mark) => {
		if (mark.type.name !== "comment") {
			newMarks.push(mark);
			return;
		}

		let markIsUsed = false;
		doc.descendants((node: ProseMirrorNode) => {
			if (node.type.name === "paragraph") {
				node.forEach((childNode: ProseMirrorNode) => {
					if (childNode.isText && childNode.marks.some((nodeMark) => nodeMark.eq(mark))) {
						markIsUsed = true;
					}
				});
			}
		});

		if (!markIsUsed) {
			newMarks.push(mark);
		}
	});

	return newMarks;
};

const createResourceIfNeed = async (
	node: ProseMirrorNode,
	apiUrlCreator: ApiUrlCreator,
	resourceService: ResourceServiceType,
) => {
	const attrs = { ...node.attrs };

	if (node.type.name === "icon" && attrs.svg) {
		const res = await FetchService.fetch(apiUrlCreator.createCustomIcon(), JSON.stringify(attrs));
		if (!res.ok) return;
		attrs.code = await res.json();
	}

	if (!attrs?.resource?.src) return { ...attrs, nodeName: node.type.name };
	const name = attrs.resource.name ? attrs.resource.name : attrs.resource.name.slice(2);
	const newName = await resourceService.setResource(name, Buffer.from(attrs.resource.src), attrs.resource.path);

	if (!newName) return;
	attrs.resource = null;

	return { ...attrs, src: newName, nodeName: node.type.name };
};

const filterMarks = async (props: FilterProps): Promise<ProseMirrorNode> => {
	const { view, node, attrs, apiUrlCreator, resourceService, headingAllowed } = props;
	const newChildren = [];

	for (let index = 0; index < node.content.childCount; index++) {
		const child = node.content.child(index);
		let newChild = child;

		if (Object.keys(newChild.attrs).length > 0 && !child.isText) {
			const newAttrs = await createResourceIfNeed(child, apiUrlCreator, resourceService);
			newChild = child.type.create(newAttrs, child.content, child.marks);
		}

		if (!headingAllowed && newChild.type.name === "heading") newChild = headingPasteFormatter(view.state, newChild);

		if (newChild.isText && newChild.marks.length > 0) {
			const newMarks = handleCommentary(view, newChild.marks);
			newChildren.push(newChild.mark(newMarks));
		} else if (newChild.childCount > 0) {
			newChildren.push(
				await filterMarks({
					...props,
					node: newChild,
					attrs: newChild.attrs,
				}),
			);
		} else {
			newChildren.push(newChild);
		}
	}

	if (node.type.name === "text") return view.state.schema.text(node.text, node.marks);
	else return node.type.create(attrs, Fragment.from(newChildren), node.marks);
};

const handleCodeBlock = (data: ClipboardItems, view: EditorView): Slice => {
	const { $from } = view.state.selection;
	const parent = $from?.parent;
	if (parent && parent.type.spec.code && data["text/plain"]) {
		const plainText = data["text/plain"].replace(/\r\n?/g, "\n");
		return new Slice(Fragment.from(view.state.schema.text(plainText)), 0, 0);
	}
};

const hasChildNodeText = (node: ProseMirrorNode): boolean => {
	for (let index = 0; index < node.content.childCount; index++) {
		const child = node.content.child(index);

		if (child.type.name.includes("list")) continue;
		if ((child.isTextblock || child.isText) && child.textContent.length) return true;
	}

	return false;
};

const handleListItem = (data: ClipboardItems, view: EditorView, node: ProseMirrorNode): Slice => {
	const parent = node.content.firstChild?.firstChild;
	const selectionNode = view.state.selection.$from.node(view.state.selection.$from.depth - 1);
	const cursorInListItem = selectionNode?.type?.name === "listItem";
	if (!cursorInListItem || hasChildNodeText(selectionNode)) return;

	if (parent && parent.type.name === "listItem") {
		const paragraph = parent.firstChild;
		if (paragraph && paragraph.type.name === "paragraph") {
			const remainingContent = [];

			parent.content.forEach((child, _, index) => {
				if (index > 0) remainingContent.push(child);
			});

			node.content.firstChild.forEach((child, _, index) => {
				if (index > 0) remainingContent.push(child);
			});

			node.content.forEach((child, _, index) => {
				if (index > 0) remainingContent.push(child);
			});

			const newFragment = Fragment.fromArray([paragraph, ...remainingContent]);

			return new Slice(newFragment, 0, 0);
		}
	}
};

const proceedNodes = async (props: FilterProps) => {
	const { node, view } = props;
	if (node.type.name === "text") {
		const newMarks = handleCommentary(view, node.marks);
		return view.state.schema.text(node.text, newMarks);
	} else return await filterMarks(props);
};

const handleOthers = (view: EditorView, node: ProseMirrorNode): Slice => {
	const slice = node.slice(0, node.content.size);
	if (handlePaste(view, null, slice)) return;
	return slice;
};

const handleNodes = (data: ClipboardItems, view: EditorView, node: ProseMirrorNode): boolean => {
	const slice = handleCodeBlock(data, view) || handleListItem(data, view, node);
	if (slice) {
		insertSlice(view.state.tr, view, slice);
		return true;
	}

	return false;
};

const insertSlice = (tr: Transaction, view: EditorView, slice: Slice) => {
	tr.replaceSelection(slice);

	const pos = Math.max(Math.min(view.state.selection.$from.pos + slice.content.size, tr.doc.content.size), 0);
	tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));

	tr.setMeta("paste", true);
	tr.setMeta("uiEvent", "paste");
	view.dispatch(tr);
};

const isTitle = (view: EditorView, fragment: Fragment): boolean => {
	const firstNode = view.state.doc.firstChild;
	const firstFragment = fragment.firstChild;
	return firstNode === firstFragment;
};

const createTitleNode = (view: EditorView, fragment: Fragment): ProseMirrorNode => {
	const node = fragment.firstChild;
	if (!node) return null;
	return view.state.schema.nodes.heading.create(null, node.content);
};

const createTitleHTML = (view: EditorView, fragment: Fragment) => {
	const node = fragment.firstChild;
	if (!node) return null;
	return DOMSerializer.fromSchema(view.state.schema).serializeNode(createTitleNode(view, fragment));
};

const createNodes = async (props: CreateProps) => {
	const { event, view, node, apiUrlCreator, resourceService } = props;

	const clipboardData: ClipboardItems = {};
	Array.from(event.clipboardData.items).forEach((item) => {
		clipboardData[item.type] = event.clipboardData.getData(item.type);
	});

	const attrs = await createResourceIfNeed(node, apiUrlCreator, resourceService);
	if (!attrs.nodeName) return;

	const headingAllowed = readyToPlace(view.state, "heading");
	const newNode = await proceedNodes({ node, view, attrs, apiUrlCreator, resourceService, headingAllowed });

	const isPasted = handleNodes(clipboardData, view, newNode);
	if (isPasted) return;

	const tr = view.state.tr;
	const pasteSlice = handleOthers(view, newNode);
	if (pasteSlice) insertSlice(tr, view, pasteSlice);
};

const createNodesJSON = (editor: EditorView, fragment: Fragment, getBuffer: (src: string) => Buffer): string[] => {
	const nodes: string[] = [];

	const processNode = (node: ProseMirrorNode): ProseMirrorNode => {
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
				content.forEach((node: ProseMirrorNode) => {
					newContent.push(processNode(node));
				});
			}

			const jsonNode = node.type.create(attrs, newContent, marks);
			return jsonNode;
		}
	};

	fragment.forEach((node: ProseMirrorNode, index: number) => {
		if (index === 0 && isTitle(editor, fragment)) nodes.push(createTitleNode(editor, fragment).toJSON());
		else nodes.push(processNode(node).toJSON());
	});

	return nodes;
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
		content.firstChild.text.split("\n").reduce((acc: ProseMirrorNode[], text) => {
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

const getImageFromFragment = (fragment: Fragment, resourceService: ResourceServiceType): boolean => {
	const firstImage =
		fragment.firstChild?.type?.name === "image" || fragment.firstChild?.type?.name === "inlineImage"
			? fragment.firstChild
			: null;

	if (!firstImage) return false;
	const buffer = resourceService.getBuffer(firstImage.attrs.src);
	if (!buffer) return false;

	const mimeType = resolveImageKind(firstImage.attrs.src);
	if (!mimeType || !IMAGE_MIME_TYPES.includes(mimeType)) return false;

	void navigator.clipboard.write([
		new ClipboardItem({
			[mimeType]: new Blob([buffer], { type: mimeType }),
		}),
	]);

	return true;
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
	resourceService: ResourceServiceType,
): { copyTypes: Record<string, string>; deleteRange: { from: number; to: number } } => {
	const { fragment, plainText, deleteRange } = createFragment(view);
	const imageData = getImageFromFragment(fragment, resourceService);
	if (imageData) return;

	return {
		copyTypes: {
			"text/gramax": JSON.stringify(createNodesJSON(view, fragment, resourceService.getBuffer)),
			"text/plain": plainText,
			"text/html": getSerializedHTML(view, fragment),
		},
		deleteRange,
	};
};

const copyArticleResource = (
	view: EditorView,
	event: ClipboardEvent,
	resourceService: ResourceServiceType,
	isCut?: boolean,
) => {
	const { from, to } = view.state.selection;
	const { tr } = view.state;
	if (from === to) return;

	const data = getNodesData(view, resourceService);
	if (data) {
		Object.entries(data.copyTypes).forEach(([type, data]) => {
			event.clipboardData.setData(type, data);
		});
	}

	if (isCut) {
		if (data?.deleteRange) {
			const clampedFrom = Math.max(Math.min(data.deleteRange.from, view.state.doc.content.size), 0);
			const clampedTo = Math.max(Math.min(data.deleteRange.to, view.state.doc.content.size), 0);
			tr.deleteRange(clampedFrom, clampedTo);
		} else tr.deleteSelection();
		view.dispatch(tr);
	}
};

const pasteArticleResource = (props: PasteProps) => {
	const { view, event, apiUrlCreator, resourceService } = props;
	const { tr } = view.state;

	const gramaxText = event.clipboardData.getData("text/gramax");
	if (gramaxText.length === 0) return false;
	try {
		const nodes = [];
		const json = JSON.parse(gramaxText);

		for (let index = 0; index < json.length; index++) {
			const jsonNode = json[index];
			nodes.push(ProseMirrorNode.fromJSON(view.state.schema.nodes?.[jsonNode.type].schema, jsonNode));
		}

		const node = view.state.schema.nodes.doc.create(null, nodes);
		void createNodes({ node, event, view, apiUrlCreator, tr, resourceService });
		return true;
	} catch {
		return false;
	}
};

export { pasteArticleResource, copyArticleResource };
