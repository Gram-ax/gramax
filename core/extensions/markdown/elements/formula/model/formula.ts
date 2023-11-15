import ParserContext from "../../../core/Parser/ParserContext/ParserContext";
import { Node, RenderableTreeNodes, Schema, Tag } from "../../../core/render/logic/Markdoc/index";

export function formula(context: ParserContext): Schema {
	return {
		render: "Formula",
		attributes: { content: { type: String } },
		transform: (node: Node): RenderableTreeNodes => {
			return new Tag("Formula", {
				content: context.parser.getRenderMarkdownIt(node.attributes.content),
			});
		},
	};
}
