import { RenderableTreeNode, RenderableTreeNodes, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import headingTransformer from "@ext/markdown/elements/heading/render/logic/headingTransformer";
import HtmlTagComponentEditTreeToRenderTree from "@ext/markdown/elements/htmlTag/render/logic/HtmlTagComponentEditTreeToRenderTreeTransformer";
import mdEditTreeToRenderTree from "@ext/markdown/elements/md/logic/mdEditTreeToRenderTree";
import { JSONContent } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";

type ComponentsNames = Record<string, string>;
export type Child = JSONContent | Tag;
type Attrs = Record<string, unknown>;

export type CustomEditTreeToRenderTree = (node: JSONContent) => RenderableTreeNodes;
export type EditTreeToRenderTreeTransformer = (node: JSONContent) => JSONContent;

const getComponentNames = (): ComponentsNames => {
	return {
		doc: "article",
		text: "Text",
		heading: "Heading",
		paragraph: "p",
		strong: "strong",
		em: "em",
		link: "Link",
		s: "s",
		code: "Code",
		code_block: "Fence",
		image: "Image",
		table_row: "TableRow",
		cut: "Cut",
		cmd: "Cmd",
		who: "Who",
		kbd: "Kbd",
		drawio: "Drawio",
		"plant-uml": "Plant-uml",
		openapi: "OpenApi",
		mermaid: "Mermaid",
		include: "Include",
		formula: "Formula",
		video: "Video",
		view: "View",
		html: "Html",
		alfa: "Alfa",
		beta: "Beta",
		when: "When",
		horizontal_rule: "hr",
		tableCell: "td",
		tableRow: "tr",
		tableHeader: "th",
		tbody: "tbody",
		color: "Color",
		thead: "thead",
		alert: "Alert",
		hard_break: "br",
		file: "Link",
	};
};

const forceChildren = ["inline-property"];

const diagramsTransformer = (node: JSONContent, componentsNames: ComponentsNames): JSONContent => {
	const diagramName = node.attrs?.diagramName?.toLowerCase();
	if (!diagramName) return node;

	const tagName = componentsNames[diagramName];
	if (!tagName) return node;

	const tag = {
		...node,
		type: tagName.toLowerCase(),
	};

	return tag;
};

const tableTransformer = (node: JSONContent): JSONContent => {
	if (node.type !== "table") return node;

	const tag = {
		...node,
		type: "Table",
	};

	const handleRow = (row: JSONContent) => {
		const tag = {
			...row,
			content: row.content?.map((cell) => handleCell(cell)),
			type: "tableRow",
		};

		return tag;
	};

	const handleCell = (cell: JSONContent) => {
		const tag = {
			...cell,
			type: "tableCell",
		};

		return tag;
	};

	const children = [{ type: "tbody", content: node.content.map((row) => handleRow(row)) }];
	tag.content = children;

	return tag;
};

const snippetTagTransformer = (node: JSONContent): JSONContent => {
	if (node.type !== "snippet") return node;

	const tag = {
		...node,
		type: "snippet",
		content: node.attrs?.content || [],
	};

	return tag;
};

const codeBlockTransformer = (node: JSONContent): JSONContent => {
	if (node.type !== "code_block") return node;

	const text = node.content?.[0]?.text || "";
	const tag = {
		...node,
		attrs: {
			...node.attrs,
			value: text,
		},
		type: "code_block",
	};

	delete tag.content;

	return tag;
};

const listTransformer = (node: JSONContent): JSONContent => {
	if (node.type !== "bulletList" && node.type !== "orderedList" && node.type !== "taskList") return node;

	const recursiveAddDepth = (node: JSONContent, depth: number) => {
		if (node.attrs?.depth !== undefined) {
			return node;
		}

		if (node.type !== "bulletList" && node.type !== "orderedList" && node.type !== "taskList") {
			if (node.content) {
				node.content = node.content.map((child) =>
					recursiveAddDepth(
						child,
						child.type === "bulletList" || child.type === "orderedList" || child.type === "taskList"
							? depth + 1
							: depth,
					),
				);
			}

			return node;
		}

		const newNode = {
			...node,
			attrs: {
				...node.attrs,
				depth,
			},
		};

		if (node.content) {
			newNode.content = node.content.map((child) =>
				recursiveAddDepth(
					child,
					child.type === "bulletList" || child.type === "orderedList" || child.type === "taskList"
						? depth + 1
						: depth,
				),
			);
		}

		return newNode;
	};

	return recursiveAddDepth(node, 0);
};

const parentLinksTagTransformer = (tag: Child): object | object[] => {
	const children = "children" in tag ? tag.children : tag.content;
	const linkChildrenExist = children.some((child: Tag) => child?.name === "Link");

	if (!linkChildrenExist) return tag;

	const newChildren: (Tag | JSONContent)[] = [];

	for (let i = 0; i < children.length; i++) {
		const child = children[i];

		if (i === 0 || child.name !== "Link") {
			newChildren.push(child);
			continue;
		}

		const currentHref = child.attributes.href;
		const previousElement = newChildren[newChildren.length - 1];

		if (previousElement && previousElement.attributes?.href === currentHref) {
			if ("children" in previousElement) previousElement.children.push(...child.children);
			else if ("content" in previousElement) previousElement.content.push(...child.children);
		} else {
			newChildren.push(child);
		}
	}

	if ("content" in tag) {
		return { ...tag, content: newChildren };
	}

	return {
		...tag,
		children: newChildren,
	};
};

const editTreeToRenderTree = (editTree: JSONContent, editSchema: Schema): RenderableTreeNode => {
	const transformNode = (node: JSONContent) => {
		const nodeHandlers = [
			diagramsTransformer,
			tableTransformer,
			codeBlockTransformer,
			listTransformer,
			HtmlTagComponentEditTreeToRenderTree,
		];

		for (const handler of nodeHandlers) {
			const result = handler(node, componentsNames);
			if (result && node !== result) return result;
		}
	};

	const transformTag = (tag: Child): object | object[] => {
		const tagHandlers = [parentLinksTagTransformer, snippetTagTransformer, headingTransformer];

		for (const handler of tagHandlers) {
			const result = handler(tag);
			if (result && tag !== result) return result;
		}

		return tag;
	};

	const createTag = (name: string, attrs: Attrs, children: string | JSONContent | Tag[]): Tag => {
		return {
			$$mdtype: "Tag",
			name,
			attributes: attrs || {},
			children: (Array.isArray(children) ? children : [children]) as Tag[], // Array of Tag and JSONContent
		};
	};

	const createNodeOrMark = (type: string, attrs: Attrs, children: string | JSONContent | Tag[]): JSONContent => {
		return {
			type,
			attrs: attrs || {},
			content: (Array.isArray(children) ? children : [children]) as unknown[], // Array of Tag and JSONContent
		};
	};

	const customConvert = (node: JSONContent) => {
		const nodeHandlers = [mdEditTreeToRenderTree];
		for (const handler of nodeHandlers) {
			const result = handler(node);
			if (result) return result;
		}
	};

	const convertNode = (node: JSONContent): object[] | object | string => {
		node = transformNode(node) || node;

		const customConvertedNode = customConvert(node);
		if (customConvertedNode) return customConvertedNode;

		if (node?.text && !node?.marks) return node.text;

		const tagName = componentsNames[node.type];
		const isInline = editSchema.nodes[node.content?.[0]?.type]?.isInline;
		const isForceChildren = forceChildren.includes(node.content?.[0]?.type);
		const tag: Child = tagName
			? createTag(tagName, node.attrs || {}, [])
			: createNodeOrMark(node.type, node.attrs || {}, []);

		// Content
		if (node.content) {
			// If the node has only one child and it's an inline node, convert it to a render node
			if (node.content.length === 1 && isInline && !isForceChildren && node.content[0].type !== "text") {
				const convertedNode = convertNode(node.content[0]);
				return convertedNode;
			}

			node.content.forEach((child) => {
				const children = convertNode(child);

				if (Array.isArray(children) && !children.some((child) => child.name === "Text")) {
					children.forEach((child2) => {
						if ("children" in tag) {
							tag.children.push(child2);
						} else if ("content" in tag) {
							tag.content.push(child2);
						}
					});
				} else {
					if ("children" in tag) {
						tag.children.push(children);
					} else if ("content" in tag) {
						tag.content.push(children as JSONContent);
					}
				}
			});
		}

		// Marks
		if (node.marks && node.marks.length > 0) {
			const marks = node.marks.map((mark) => editSchema.marks[mark.type]);
			marks.sort((a: any, b: any) => (b.rank || 0) - (a.rank || 0));

			let wrappedTag = node.text ? node.text : tag;
			marks.forEach((mark) => {
				const nodeMark = node.marks.find((m) => m.type === mark.name);
				const markName = componentsNames[mark.name];

				wrappedTag = markName
					? createTag(markName, nodeMark?.attrs || {}, [wrappedTag])
					: createNodeOrMark(mark.name, nodeMark?.attrs || {}, [wrappedTag]);
			});

			return transformTag(wrappedTag as Child);
		}

		return transformTag(tag);
	};

	const componentsNames = getComponentNames();
	const document = convertNode(editTree) as RenderableTreeNode;

	return document;
};

export default editTreeToRenderTree;
