import { Config, Node, Schema, SchemaType, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { renderName } from "@ext/markdown/elements/question/consts";

export function question(): Schema {
	return {
		render: renderName,
		selfClosing: false,
		attributes: {
			id: { type: String },
			type: { type: String },
			required: { type: Boolean },
		},
		type: SchemaType.block,
		transform: async (node: Node, config: Config) => {
			return new Tag("Question", node.attributes, await node.transformChildren(config));
		},
	};
}
