import { type Schema, SchemaType, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import type Node from "@ext/markdown/core/render/logic/Markdoc/src/ast/node";
import type { Config } from "@ext/markdown/core/render/logic/Markdoc/src/types";

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
