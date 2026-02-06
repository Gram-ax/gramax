import PrivateParserContext from "../../../core/Parser/ParserContext/PrivateParserContext";
import { Node, Schema, Tag } from "../../../core/render/logic/Markdoc/index";

export function term(context: PrivateParserContext): Schema {
	return {
		render: "Term",
		attributes: {
			code: { type: String },
			title: { type: String },
		},
		transform: async (node: Node) => {
			const code = node.attributes.code;
			const customTitle = node.attributes.title;
			const term = context.getProp("terms")[code];
			return new Tag("Term", {
				title: customTitle ?? term?.title ?? code,
				summary: term?.summary ?? "",
				url: term?.url ?? null,
				children:
					typeof term == "string"
						? await context.parser.parseRenderableTreeNode(term)
						: term?.description
							? await context.parser.parseRenderableTreeNode(term.description)
							: null,
			});
		},
	};
}
