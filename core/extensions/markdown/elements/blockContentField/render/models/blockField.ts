import { type Schema, SchemaType, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import type Node from "@ext/markdown/core/render/logic/Markdoc/src/ast/node";
import type { Config } from "@ext/markdown/core/render/logic/Markdoc/src/types";
import { renderName } from "@ext/markdown/elements/blockContentField/consts";

export const blockField: Schema = {
	render: renderName,
	type: SchemaType.block,
	selfClosing: false,
	attributes: {
		bind: { type: String },
		placeholder: { type: String },
	},
	transform: async (node: Node, config: Config) => {
		return new Tag(
			renderName,
			{ bind: node.attributes.bind, placeholder: node.attributes.placeholder },
			await node.transformChildren(config),
		);
	},
};
