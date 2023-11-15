import { Config, Node, Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";
import isInline from "../../../elementsUtils/isInlineChildren";

export const color: Schema = {
	render: "Color",
	attributes: {
		color: { type: String },
	},
	type: SchemaType.variable,
	selfClosing: false,
	transform: async (node: Node, config: Config) => {
		const children = await node.transformChildren(config);
		return new Tag("Color", { color: node.attributes.color, isInline: isInline(children) }, children);
	},
};
