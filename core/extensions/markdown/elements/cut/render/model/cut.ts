import { Config, Node, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";
import isInline from "../../../../elementsUtils/isInlineChildren";

export const cut: Schema = {
	render: "Cut",
	attributes: {
		text: { type: String },
		expanded: { type: String },
	},
	type: SchemaType.variable,
	selfClosing: false,
	transform: async (node: Node, config: Config) => {
		const children = await node.transformChildren(config);
		return new Tag(
			"Cut",
			{
				text: node.attributes.text ?? "Раскрыть",
				expanded: node.attributes.expanded,
				isInline: isInline(children),
			},
			children,
		);
	},
};
