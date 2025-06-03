import { JSONContent } from "@tiptap/core";
import { parse } from "@ext/markdown/elements/image/render/logic/imageTransformer";

type HtmlTagToComponentType = (node: JSONContent) => JSONContent;

const headingTransformer =
	(level: number): HtmlTagToComponentType =>
	(node) => {
		node.type = "heading";
		node.attrs = { ...node.attrs?.attributes, level };
		return node;
	};

const markTransformer =
	(markName: string): HtmlTagToComponentType =>
	(node) => {
		const traverse = (node: JSONContent) => {
			if (node.type === "blockHtmlTagComponent" || node.type === "inlineHtmlTagComponent") {
				return node.attrs.content.content.map(traverse);
			}
			node.marks = [...(node.marks || []), { type: markName }];
		};

		node.content?.map(traverse);
		return node.content;
	};

const NodeTransformer =
	(nodeName: string, getAttrs?: (node: JSONContent) => Record<string, any>): HtmlTagToComponentType =>
	(node) => {
		node.type = nodeName;
		node.attrs = {
			...node.attrs?.attributes,
			...(getAttrs ? getAttrs(node) : {}),
		};
		return node;
	};

const removeNode: HtmlTagToComponentType = (node) => {
	return node.content;
};

const HtmlTagToComponent = {
	p: removeNode,
	div: removeNode,
	span: removeNode,
	b: markTransformer("strong"),
	strong: markTransformer("strong"),
	i: markTransformer("em"),
	em: markTransformer("em"),
	a: markTransformer("link"),
	code: markTransformer("code"),
	strike: markTransformer("s"),
	s: markTransformer("s"),
	h1: headingTransformer(2),
	h2: headingTransformer(2),
	h3: headingTransformer(3),
	h4: headingTransformer(4),
	h5: headingTransformer(5),
	h6: headingTransformer(6),
	pre: NodeTransformer("code_block"),
	li: NodeTransformer("listItem"),
	ul: NodeTransformer("bulletList"),
	ol: NodeTransformer("orderedList"),
	blockquote: NodeTransformer("note", () => ({ type: "quote" })),
	img: NodeTransformer("image", (node) =>
		parse(
			node.attrs.attributes.crop ?? "0,0,100,100",
			node.attrs.attributes.scale ?? null,
			node.attrs.attributes.objects ?? "[]",
			node.attrs.attributes.width,
			node.attrs.attributes.height,
		),
	),
} as const;

export default HtmlTagToComponent;
