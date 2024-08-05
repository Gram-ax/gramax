import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import initArticleResource from "@ext/markdown/elementsUtils/AtricleResource/initArticleResource";
import { Attrs, DOMSerializer, Fragment, Mark, Node, Schema } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { EditorView } from "prosemirror-view";

interface CreateProps {
	node: Node;
	position: number;
	view: EditorView;
	articleProps: ClientArticleProps;
	apiUrlCreator: ApiUrlCreator;
}
interface FilterProps {
	view: EditorView;
	node: Node;
	attrs: [] | Attrs;
	apiUrlCreator: ApiUrlCreator;
	articleProps: ClientArticleProps;
}

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

const createResource = async (node: Node, apiUrlCreator: ApiUrlCreator, articleProps: ClientArticleProps) => {
	const attrs = { ...node.attrs };

	if (!attrs?.resource?.src) return { ...attrs, nodeName: node.type.name };
	const splitted = attrs.resource.name ? attrs.resource.name.split(".") : attrs.resource.name.slice(2).split(".");
	const newName = await initArticleResource(
		articleProps,
		apiUrlCreator,
		Buffer.from(attrs.resource.src),
		splitted[1],
		splitted[0],
	);
	if (!newName) return;
	attrs.resource = null;

	return { ...attrs, src: newName, nodeName: node.type.name };
};

const filterMarks = async (props: FilterProps): Promise<Node> => {
	const { view, node, attrs, apiUrlCreator, articleProps } = props;
	const newChildren = [];

	for (let index = 0; index < node.content.childCount; index++) {
		const child = node.content.child(index);
		let newChild = child;

		if (Object.keys(newChild.attrs).length > 0 && !child.isText) {
			const newAttrs = await createResource(child, apiUrlCreator, articleProps);
			newChild = child.type.create(newAttrs, child.content, child.marks);
		}

		if (newChild.isText && newChild.marks.length > 0) {
			const newMarks = handleCommentary(view, newChild.marks);
			newChildren.push(newChild.mark(newMarks));
		} else if (newChild.childCount > 0) {
			newChildren.push(
				await filterMarks({ view, node: newChild, attrs: newChild.attrs, apiUrlCreator, articleProps }),
			);
		} else {
			newChildren.push(newChild);
		}
	}

	if (node.type.name === "text") return view.state.schema.text(node.text, node.marks);
	else return node.type.create(attrs, Fragment.from(newChildren), node.marks);
};

const createNodes = async (props: CreateProps) => {
	const { position, view, node, apiUrlCreator, articleProps } = props;
	const attrs = await createResource(node, apiUrlCreator, articleProps);
	if (!attrs.nodeName) return;

	let newNode: Node;

	if (node.type.name === "text") {
		const newMarks = handleCommentary(view, node.marks);
		newNode = view.state.schema.text(node.text, newMarks);
	} else newNode = await filterMarks({ view, node, attrs, apiUrlCreator, articleProps });

	const { tr } = view.state;

	tr.replaceSelectionWith(newNode);

	let i = 0;
	for (let childNode = newNode.lastChild; childNode.lastChild && !(childNode.isText || childNode.isTextblock); i++)
		childNode = childNode.lastChild;
	const endPos = position + newNode.content.size - i;

	if (endPos <= tr.doc.content.size) tr.setSelection(TextSelection.create(tr.doc, endPos));
	else tr.setSelection(TextSelection.create(tr.doc, tr.doc.content.size));

	view.dispatch(tr);
};

const createNodesJSON = (editor: EditorView, fragment: Fragment): string[] => {
	const nodes: string[] = [];

	const processNode = (node: Node): Node => {
		const { attrs, content, marks } = {
			attrs: { ...node.attrs },
			content: node.content,
			marks: node.marks,
		};

		if (node.attrs.src) {
			attrs.resource = {
				name: attrs.src.slice(2),
				src: OnLoadResourceService.getBuffer(attrs.src),
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

	fragment.forEach((node: Node) => {
		nodes.push(processNode(node).toJSON());
	});

	return nodes;
};

const createTableFragment = (content: Fragment, schema: Schema<any, any>) => {
	const tableFragment =
		content.firstChild.type.name === "table"
			? content
			: Fragment.empty.addToStart(schema.nodes.table.create(null, content));
	return {
		fragment: tableFragment,
		plainText: tableFragment.textBetween(0, tableFragment.size, "\n"),
	};
};

const createFragment = (
	view: EditorView,
): {
	fragment: Fragment;
	plainText: string;
} => {
	const { $from, $to, ranges } = view.state.selection;
	const { doc, schema } = view.state;
	const parent = $from.node($from.depth - 1);
	const parentName = parent?.type?.name;

	if ((parentName === "tableRow" || parentName === "tableHeader") && ranges.length > 1)
		return createTableFragment(view.state.selection.content().content, schema);

	const slice = doc.slice($from.pos, $to.pos);
	if (slice.content?.firstChild?.type?.name !== "list_item")
		return { fragment: slice.content, plainText: window.getSelection().toString() };

	return {
		fragment: Fragment.from(parent.type.create(null, slice.content)),
		plainText: window.getSelection().toString(),
	};
};

const copyArticleResource = (view: EditorView, event: ClipboardEvent, isCut?: boolean) => {
	const { from, to } = view.state.selection;
	const { tr, schema } = view.state;

	if (from === to) return;

	const { fragment, plainText } = createFragment(view);
	const div = document.createElement("div");
	div.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(fragment));
	const jsonText = createNodesJSON(view, fragment);
	event.clipboardData.setData("text/gramax", JSON.stringify(jsonText));
	event.clipboardData.setData("text/plain", plainText);
	event.clipboardData.setData(
		"text/html",
		new XMLSerializer().serializeToString(new DOMParser().parseFromString(div.innerHTML, "text/html")),
	);

	if (isCut) {
		tr.deleteSelection();
		view.dispatch(tr);
	}
};

const pasteArticleResource = (
	view: EditorView,
	event: ClipboardEvent,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
) => {
	const { tr } = view.state;
	const { from, to } = view.state.selection;
	tr.deleteRange(from, to);
	view.dispatch(tr);

	const gramaxText = event.clipboardData.getData("text/gramax");
	if (gramaxText.length == 0) return false;
	try {
		const nodes = [];
		const json = JSON.parse(gramaxText);

		for (let index = 0; index < json.length; index++) {
			const jsonNode = json[index];
			nodes.push(Node.fromJSON(view.state.schema.nodes?.[jsonNode.type].schema, jsonNode));
		}

		const doc = view.state.schema.nodes.doc.create([], nodes);
		void createNodes({ node: doc, position: from, view, articleProps, apiUrlCreator });
		return true;
	} catch {
		return false;
	}
};

export { pasteArticleResource, copyArticleResource };
