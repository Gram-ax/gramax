import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
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
	tr: Transaction;
}
interface FilterProps {
	view: EditorView;
	node: Node;
	attrs: [] | Attrs;
	apiUrlCreator: ApiUrlCreator;
	articleProps: ClientArticleProps;
}

interface PasteProps {
	view: EditorView;
	event: ClipboardEvent;
	articleProps: ClientArticleProps;
	apiUrlCreator: ApiUrlCreator;
}

interface CreatedFragment {
	fragment: Fragment;
	plainText: string;
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
		splitted[splitted.length - 1],
		splitted[splitted.length - 2].slice(1, splitted[splitted.length - 2].length),
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
	const { event, view, node, apiUrlCreator, articleProps } = props;
	const { $from } = view.state.selection;
	const attrs = await createResource(node, apiUrlCreator, articleProps);
	if (!attrs.nodeName) return;
	const tr = view.state.tr;
	const parent = $from?.parent;

	if (parent && parent.type.spec.code) {
		const text = new Slice(
			Fragment.from(view.state.schema.text(event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n"))),
			0,
			0,
		);

		tr.replaceSelection(text);
		tr.setMeta("paste", true);
		tr.setMeta("uiEvent", "paste");
		view.dispatch(tr);

		return;
	}

	let newNode: Node;

	if (node.type.name === "text") {
		const newMarks = handleCommentary(view, node.marks);
		newNode = view.state.schema.text(node.text, newMarks);
	} else newNode = await filterMarks({ view, node, attrs, apiUrlCreator, articleProps });

	const slice = newNode.slice(0, newNode.content.size);
	if (handlePaste(view, null, slice)) return;

	tr.replaceSelection(slice);
	tr.setMeta("paste", true);
	tr.setMeta("uiEvent", "paste");
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
				...attrs,
				name: attrs.src,
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

	if (slice.content?.firstChild?.type?.name === "list_item") {
		const parent = (parentName === "doc" && $from.node($from.depth - 1)) || $from.node($from.depth - 2);
		return {
			fragment: Fragment.from(parent.copy(slice.content)),
			plainText: window.getSelection().toString(),
		};
	}

	return { fragment: slice.content, plainText: window.getSelection().toString() };
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

const pasteArticleResource = (props: PasteProps) => {
	const { view, event, articleProps, apiUrlCreator } = props;
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
		void createNodes({ node, event, view, articleProps, apiUrlCreator, tr });
		return true;
	} catch {
		return false;
	}
};

export { pasteArticleResource, copyArticleResource };
