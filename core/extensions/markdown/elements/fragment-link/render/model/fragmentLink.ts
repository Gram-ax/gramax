import type PrivateParserContext from "../../../../core/Parser/ParserContext/PrivateParserContext";
import { type Node, type Schema, Tag } from "../../../../core/render/logic/Markdoc/index";

export function fragmentLink(_context: PrivateParserContext): Schema {
	return {
		render: "Fragment-link",
		selfClosing: false,
		attributes: { id: { type: String } },

		transform: async (node: Node, config) => {
			return new Tag("Fragment-link", { id: node.attributes.id }, await node.transformChildren(config));
		},
	};
}
