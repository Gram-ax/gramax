import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { OnLoadResource } from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import initArticleResource from "@ext/markdown/elementsUtils/AtricleResource/initArticleResource";
import { Attrs, DOMSerializer, Fragment, Mark, Node, Schema, Slice } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { handlePaste } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";

interface CreateProps {
	node: Node;
	view: EditorView;
	event: ClipboardEvent;
	articleProps: ClientArticleProps;
	apiUrlCreator: ApiUrlCreator;
	onLoadResource: OnLoadResource;
	tr: Transaction;
}
interface FilterProps {
	view: EditorView;
	node: Node;
	attrs: [] | Attrs;
	apiUrlCreator: ApiUrlCreator;
	articleProps: ClientArticleProps;
	onLoadResource: OnLoadResource;
}

interface PasteProps {
	view: EditorView;
	event: ClipboardEvent;
	articleProps: ClientArticleProps;
	apiUrlCreator: ApiUrlCreator;
	onLoadResource: OnLoadResource;
}

interface CreatedFragment {
	fragment: Fragment;
	plainText: string;
	deleteRange?: { from: number; to: number };
}

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
		doc.descendants((node: Node) => {
			if (node.type.name === "paragraph") {
				node.forEach((childNode: Node) => {
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

const createResource = async (
	node: Node,
	apiUrlCreator: ApiUrlCreator,
	articleProps: ClientArticleProps,
	onLoadResource: OnLoadResource,
) => {
	const attrs = { ...node.attrs };

	if (!attrs?.resource?.src) return { ...attrs, nodeName: node.type.name };
	const splitted = attrs.resource.name ? attrs.resource.name.split(".") : attrs.resource.name.slice(2).split(".");
	const newName = await initArticleResource(
		articleProps,
		apiUrlCreator,
		onLoadResource,
		Buffer.from(attrs.resource.src),
		splitted[splitted.length - 1],
		splitted[splitted.length - 2].slice(1, splitted[splitted.length - 2].length),
	);
	if (!newName) return;
	attrs.resource = null;

	return { ...attrs, src: newName, nodeName: node.type.name };
};

const filterMarks = async (props: FilterProps): Promise<Node> => {
	const { view, node, attrs, apiUrlCreator, articleProps, onLoadResource } = props;
	const newChildren = [];

	for (let index = 0; index < node.content.childCount; index++) {
		const child = node.content.child(index);
		let newChild = child;

		if (Object.keys(newChild.attrs).length > 0 && !child.isText) {
			const newAttrs = await createResource(child, apiUrlCreator, articleProps, onLoadResource);
			newChild = child.type.create(newAttrs, child.content, child.marks);
		}

		if (newChild.isText && newChild.marks.length > 0) {
			const newMarks = handleCommentary(view, newChild.marks);
			newChildren.push(newChild.mark(newMarks));
		} else if (newChild.childCount > 0) {
			newChildren.push(
				await filterMarks({
					view,
					node: newChild,
					attrs: newChild.attrs,
					apiUrlCreator,
					articleProps,
					onLoadResource,
				}),
			);
		} else {
			newChildren.push(newChild);
		}
	}

	if (node.type.name === "text") return view.state.schema.text(node.text, node.marks);
	else return node.type.create(attrs, Fragment.from(newChildren), node.marks);
};

const handleCodeBlock = (event: ClipboardEvent, view: EditorView): Slice => {
	const { $from } = view.state.selection;
	const parent = $from?.parent;
	if (parent && parent.type.spec.code) {
		return new Slice(
			Fragment.from(view.state.schema.text(event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n"))),
			0,
			0,
		);
	}
};

const handleListItem = (event: ClipboardEvent, view: EditorView, node: Node): Slice => {
	const parent = node.content.firstChild?.firstChild;
	const selectionNode = view.state.selection.$from.node(view.state.selection.$from.depth - 1);
	const cursorInListItem = selectionNode?.type?.name === "listItem";
	if (!cursorInListItem || selectionNode.textContent) return;

	if (parent && parent.type.name === "listItem") {
		const firstListItem = parent.firstChild;
		if (firstListItem && firstListItem.type.name === "paragraph") {
			const paragraph = firstListItem;
			const remainingContent = [];

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

const proceedNodes = async (
	node: Node,
	view: EditorView,
	attrs: Record<string, unknown>,
	apiUrlCreator: ApiUrlCreator,
	articleProps: ClientArticleProps,
	onLoadResource: OnLoadResource,
) => {
	if (node.type.name === "text") {
		const newMarks = handleCommentary(view, node.marks);
		return view.state.schema.text(node.text, newMarks);
	} else return await filterMarks({ view, node, attrs, apiUrlCreator, articleProps, onLoadResource });
};

const handleOthers = (view: EditorView, node: Node): Slice => {
	const slice = node.slice(0, node.content.size);
	if (handlePaste(view, null, slice)) return;
	return slice;
};

const handleNodes = (event: ClipboardEvent, view: EditorView, node: Node): boolean => {
	const slice = handleCodeBlock(event, view) || handleListItem(event, view, node);
	if (slice) {
		insertSlice(view.state.tr, view, slice);
		return true;
	}

	return false;
};

const insertSlice = (tr: Transaction, view: EditorView, slice: Slice) => {
	tr.replaceSelection(slice);
	tr.setMeta("paste", true);
	tr.setMeta("uiEvent", "paste");
	view.dispatch(tr);
};

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

const createNodes = async (props: CreateProps) => {
	const { event, view, node, apiUrlCreator, articleProps, onLoadResource } = props;
	const attrs = await createResource(node, apiUrlCreator, articleProps, onLoadResource);
	if (!attrs.nodeName) return;
	const tr = view.state.tr;
	const newNode = await proceedNodes(node, view, attrs, apiUrlCreator, articleProps, onLoadResource);

	const isPasted = handleNodes(event, view, newNode);
	if (isPasted) return;

	const pasteSlice = handleOthers(view, newNode);
	if (pasteSlice) insertSlice(tr, view, pasteSlice);
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
			return editor.state.schema.text(node.text, marks);
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

const createFragment = (view: EditorView): CreatedFragment => {
	const { $from, $to, ranges } = view.state.selection;
	const { doc, schema } = view.state;
	const parent = $from.node($from.depth - 2);
	const parentName = parent?.type?.name;
	const slice = doc.slice($from.pos, $to.pos);

	if (parentName === "table" && ranges.length > 1)
		return createTableFragment(view.state.selection.content().content, schema);

	if (parentName === "doc" && $from.pos === doc.firstChild.nodeSize && $to.pos === doc.content.size)
		return {
			fragment: doc.slice(doc.firstChild.nodeSize, doc.content.size, true).content,
			plainText: window.getSelection().toString(),
		};

	if (slice.content?.firstChild?.type?.name === "listItem") {
		const parent = (parentName === "doc" && $from.node($from.depth - 1)) || $from.node($from.depth - 2);
		return {
			fragment: Fragment.from(parent.copy(slice.content)),
			plainText: window.getSelection().toString(),
			deleteRange: { from: $from.pos - 2, to: $to.pos },
		};
	}

	return { fragment: slice.content, plainText: window.getSelection().toString() };
};

const getImageFromFragment = (fragment: Fragment, onLoadResource: OnLoadResource): boolean => {
	const firstImage = fragment.firstChild?.type?.name === "image" ? fragment.firstChild : null;

	if (!firstImage) return false;
	const buffer = onLoadResource.getBuffer(firstImage.attrs.src);
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
	onLoadResource: OnLoadResource,
): { copyTypes: Record<string, string>; deleteRange: { from: number; to: number } } => {
	const { fragment, plainText, deleteRange } = createFragment(view);
	const imageData = getImageFromFragment(fragment, onLoadResource);
	if (imageData) return;

	return {
		copyTypes: {
			"text/gramax": JSON.stringify(createNodesJSON(view, fragment, onLoadResource.getBuffer)),
			"text/plain": plainText,
			"text/html": getSerializedHTML(view, fragment),
		},
		deleteRange,
	};
};

const copyArticleResource = (
	view: EditorView,
	event: ClipboardEvent,
	onLoadResource: OnLoadResource,
	isCut?: boolean,
) => {
	const { from, to } = view.state.selection;
	const { tr } = view.state;
	if (from === to) return;

	const { copyTypes, deleteRange } = getNodesData(view, onLoadResource);
	if (copyTypes) {
		Object.entries(copyTypes).forEach(([type, data]) => {
			event.clipboardData.setData(type, data);
		});
	}

	if (isCut) {
		if (deleteRange) tr.deleteRange(deleteRange.from, deleteRange.to);
		else tr.deleteSelection();
		view.dispatch(tr);
	}
};

const pasteArticleResource = (props: PasteProps) => {
	const { view, event, articleProps, apiUrlCreator, onLoadResource } = props;
	const { tr } = view.state;

	const gramaxText = event.clipboardData.getData("text/gramax");
	if (gramaxText.length === 0) return false;
	try {
		const nodes = [];
		const json = JSON.parse(gramaxText);

		for (let index = 0; index < json.length; index++) {
			const jsonNode = json[index];
			nodes.push(Node.fromJSON(view.state.schema.nodes?.[jsonNode.type].schema, jsonNode));
		}

		const node = view.state.schema.nodes.doc.create(null, nodes);
		void createNodes({ node, event, view, articleProps, apiUrlCreator, tr, onLoadResource });
		return true;
	} catch {
		return false;
	}
};

export { pasteArticleResource, copyArticleResource };
