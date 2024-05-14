import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { Node, Schema, Tag } from "../../../../core/render/logic/Markdoc/index";

export function icon(context: ParserContext): Schema {
	return {
		render: "Icon",
		attributes: { code: { type: String }, color: { type: String } },

		transform: async (node: Node) => {
			let svg: string;
			try {
				svg = await context.getCatalog().iconProvider.getIconByCode(node.attributes.code);
			} catch {}
			if (!svg) context.icons.add(node.attributes.code);
			return new Tag("Icon", { code: node.attributes.code, svg: svg, color: node.attributes.color });
		},
	};
}
