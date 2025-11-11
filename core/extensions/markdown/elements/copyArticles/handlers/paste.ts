import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import headingPasteFormatter from "@ext/markdown/elements/heading/edit/logic/headingPasteFormatter";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import { Attrs, Fragment, Mark, Node, Slice } from "@tiptap/pm/model";
import { Selection, Transaction } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { handlePaste } from "prosemirror-tables";
import { GramaxClipboardData } from "@ext/markdown/elements/copyArticles/handlers/copy";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";

interface CreateProps {
	node: Node;
	view: EditorView;
	event: ClipboardEvent;
	copyData: GramaxClipboardData;
	apiUrlCreator: ApiUrlCreator;
	catalogProps: ClientCatalogProps;
	resourceService: ResourceServiceType;
	tr: Transaction;
}
interface FilterProps {
	view: EditorView;
	node: Node;
	attrs: Attrs;
	copyData: GramaxClipboardData;
	headingAllowed: boolean;
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
	catalogProps: ClientCatalogProps;
}

interface PasteProps {
	view: EditorView;
	event: ClipboardEvent;
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
	catalogProps: ClientCatalogProps;
}

interface HandleNodesProps extends Omit<FilterProps, "catalogProps"> {
	isStorageConnected: boolean;
}

type ClipboardItems = Record<string, string>;

const createResourceIfNeed = async (node: Node, apiUrlCreator: ApiUrlCreator, resourceService: ResourceServiceType) => {
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

const copyCommentIfNeed = async (
	id: string,
	apiUrlCreator: ApiUrlCreator,
	copyData: GramaxClipboardData,
): Promise<boolean> => {
	const res = await FetchService.fetch(apiUrlCreator.copyComment(id, copyData.copyPath));
	if (!res.ok) return false;
	return await res.json();
};

const handleCommentaryMarks = async (
	view: EditorView,
	marks: Mark[] | readonly Mark[],
	apiUrlCreator: ApiUrlCreator,
	copyData: GramaxClipboardData,
	isStorageConnected: boolean,
): Promise<Mark[] | readonly Mark[]> => {
	if (!isStorageConnected) return marks.filter((mark) => mark.type.name !== "comment");

	const newMarks: Mark[] = [];
	const existedComments: string[] = [];

	const { doc } = view.state;

	doc.descendants((node: Node) => {
		node.forEach((childNode: Node) => {
			const commentMark = childNode.marks.find((mark) => mark.type.name === "comment");
			if (commentMark) existedComments.push(commentMark.attrs.id);
		});
	});

	for (const mark of marks) {
		if (mark.type.name !== "comment" || existedComments.includes(mark.attrs.id)) {
			newMarks.push(mark);
			continue;
		}

		const copyComment = await copyCommentIfNeed(mark.attrs.id, apiUrlCreator, copyData);
		if (copyComment) {
			newMarks.push(mark.type.create({ id: mark.attrs.id }));
			existedComments.push(mark.attrs.id);
		}
	}

	return newMarks;
};

const handleNodeCommentary = async (
	view: EditorView,
	node: Node,
	apiUrlCreator: ApiUrlCreator,
	copyData: GramaxClipboardData,
): Promise<Node> => {
	if (!node.attrs?.comment?.id) return node;

	const copyComment = await copyCommentIfNeed(node.attrs.comment.id, apiUrlCreator, copyData);
	if (!copyComment) return node.type.create({ ...node.attrs, comment: { id: null } }, node.content, node.marks);

	return node.type.create({ ...node.attrs, comment: { id: node.attrs.comment.id } }, node.content, node.marks);
};

const handleNodes = async (props: HandleNodesProps): Promise<Node> => {
	const { view, node, attrs, apiUrlCreator, resourceService, headingAllowed, copyData, isStorageConnected } = props;
	const newChildren = [];

	for (let index = 0; index < node.content.childCount; index++) {
		const child = node.content.child(index);
		let newChild = child;

		if (Object.keys(newChild.attrs).length > 0 && !child.isText) {
			const newAttrs = await createResourceIfNeed(child, apiUrlCreator, resourceService);
			newChild = child.type.create(newAttrs, child.content, child.marks);
		}

		newChild = await handleNodeCommentary(view, newChild, apiUrlCreator, copyData);

		if (!headingAllowed && newChild.type.name === "heading") newChild = headingPasteFormatter(view.state, newChild);

		if (newChild.isText && newChild.marks.length > 0) {
			const newMarks = await handleCommentaryMarks(
				view,
				newChild.marks,
				apiUrlCreator,
				copyData,
				isStorageConnected,
			);
			newChildren.push(newChild.mark(newMarks));
		} else if (newChild.childCount > 0) {
			newChildren.push(await handleNodes({ ...props, node: newChild, attrs: newChild.attrs }));
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

const hasChildNodeText = (node: Node): boolean => {
	for (let index = 0; index < node.content.childCount; index++) {
		const child = node.content.child(index);

		if (child.type.name.includes("list")) continue;
		if ((child.isTextblock || child.isText) && child.textContent.length) return true;
	}

	return false;
};

const handleListItem = (data: ClipboardItems, view: EditorView, node: Node): Slice => {
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
	const { node, view, catalogProps } = props;
	const isStorageConnected = catalogProps?.sourceName?.length > 0;

	if (node.type.name === "text") {
		const newMarks = node.marks;
		return view.state.schema.text(node.text, newMarks);
	} else return await handleNodes({ ...props, isStorageConnected });
};

const handleOthers = (view: EditorView, node: Node): Slice => {
	const slice = node.slice(0, node.content.size);
	if (handlePaste(view, null, slice)) return;
	return slice;
};

const handleNodesPaste = (data: ClipboardItems, view: EditorView, node: Node): boolean => {
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

const createNodes = async (props: CreateProps) => {
	const { event, view, node, apiUrlCreator, resourceService, copyData, catalogProps } = props;

	const clipboardData: ClipboardItems = {};
	Array.from(event.clipboardData.items).forEach((item) => {
		clipboardData[item.type] = event.clipboardData.getData(item.type);
	});

	const attrs = await createResourceIfNeed(node, apiUrlCreator, resourceService);
	if (!attrs.nodeName) return;

	const headingAllowed = readyToPlace(view.state, "heading");
	const newNode = await proceedNodes({
		node,
		view,
		attrs,
		apiUrlCreator,
		resourceService,
		headingAllowed,
		copyData,
		catalogProps,
	});

	const isPasted = handleNodesPaste(clipboardData, view, newNode);
	if (isPasted) return;

	const tr = view.state.tr;
	const pasteSlice = handleOthers(view, newNode);
	if (pasteSlice) insertSlice(tr, view, pasteSlice);
};

export const paste = (props: PasteProps) => {
	const { view, event, apiUrlCreator, resourceService, catalogProps } = props;
	const { tr } = view.state;

	const gramaxText = event.clipboardData.getData("text/gramax");
	if (gramaxText.length === 0) return false;

	try {
		const nodes = [];
		const data: GramaxClipboardData = JSON.parse(gramaxText);

		for (let index = 0; index < data.data.length; index++) {
			const jsonNode = data.data[index];
			nodes.push(Node.fromJSON(view.state.schema.nodes?.[jsonNode.type].schema, jsonNode));
		}

		const node = view.state.schema.nodes.doc.create(null, nodes);
		void createNodes({ node, event, view, apiUrlCreator, tr, resourceService, catalogProps, copyData: data });
		return true;
	} catch {
		return false;
	}
};
