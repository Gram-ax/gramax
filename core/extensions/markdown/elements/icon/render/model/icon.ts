import PrivateParserContext from "../../../../core/Parser/ParserContext/PrivateParserContext";
import { Node, Schema, Tag } from "../../../../core/render/logic/Markdoc/index";

export function icon(context: PrivateParserContext): Schema {
	return {
		render: "Icon",
		attributes: { code: { type: String }, color: { type: String } },

		transform: async (node: Node) => {
			context.icons.add(node.attributes.code);
			const svg = await context.getCatalog().customProviders.iconProvider.getIconByCode(node.attributes.code);
			return new Tag("icon", { code: node.attributes.code, svg: svg, color: node.attributes.color });
		},
	};
}
