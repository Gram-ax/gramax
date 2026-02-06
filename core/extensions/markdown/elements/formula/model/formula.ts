import PrivateParserContext from "../../../core/Parser/ParserContext/PrivateParserContext";
import { Node, RenderableTreeNodes, Schema, Tag } from "../../../core/render/logic/Markdoc/index";

export function formula(context: PrivateParserContext): Schema {
	return {
		render: "Formula",
		attributes: { content: { type: String }, latex: { type: String } },
		transform: async (node: Node): Promise<RenderableTreeNodes> => {
			return new Tag("Formula", {
				content: await context.parser.getRenderMarkdownIt(node.attributes.content),
				latex: node.attributes.content,
			});
		},
	};
}
