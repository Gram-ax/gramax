import { Config, Node } from "@ext/markdown/core/render/logic/Markdoc/src/types";
import { SchemaType, Tag, Schema } from "@ext/markdown/core/render/logic/Markdoc";

export const inlineProperty: Schema = {
	render: "Inline-property",
	type: SchemaType.inline,
	attributes: {
		bind: { type: String },
	},
	transform: async (node: Node, config: Config) => {
		return new Tag("Inline-property", { bind: node.attributes.bind }, await node.transformChildren(config));
	},
};
