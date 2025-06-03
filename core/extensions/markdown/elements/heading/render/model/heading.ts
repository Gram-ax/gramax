import { RenderableTreeNode, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";
import getChildTextId from "../../logic/getChildTextId";

export const heading: Schema = {
	render: "Heading",
	attributes: {
		level: { type: Number },
		id: { type: String },
	},
	type: SchemaType.block,
	transform: async (node, config) => {
		const children = await node.transformChildren(config);
		const title = getHeaderTitle(children);
		return new Tag(
			"Heading",
			{
				level: node.attributes.level,
				title: title,
				id: node?.attributes?.id ?? getChildTextId(title),
			},
			children,
		);
	},
};

export const getHeaderTitle = (children: RenderableTreeNode[]) => {
	const createHeaderTitle = (str: string, children: RenderableTreeNode[]) => {
		if (!children) return str;
		if (typeof children === "string") return str + children;
		return (
			str +
			children
				.map((child) => (typeof child === "string" ? child : createHeaderTitle(str, child.children)))
				.join("")
		);
	};
	return createHeaderTitle("", children);
};
