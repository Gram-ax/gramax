import ParserContext from "../../core/Parser/ParserContext/ParserContext";
import { Node, RenderableTreeNodes, Schema, SchemaType, Tag } from "../../core/render/logic/Markdoc/index";

export function error(context: ParserContext): Schema {
	return {
		render: "Error",
		attributes: {
			message: { type: String },
			stack: { type: String },
		},
		selfClosing: false,
		type: SchemaType.block,
		transform: (node: Node): RenderableTreeNodes => {
			return new Tag("Error", {
				error: { message: node.attributes.message, stack: node.children[0].attributes.content },
				isLogged: context.getIsLogged(),
				lang: context.getLanguage(),
			});
		},
	};
}
