import SnippetRenderData from "@ext/markdown/elements/snippet/model/SnippetRenderData";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { Node, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";

export function snippet(context: ParserContext): Schema {
	return {
		render: "Snippet",
		type: SchemaType.block,
		attributes: { id: { type: String } },

		transform: async (node: Node) => {
			const snippetProvider = context.getCatalog().snippetProvider;
			let snippetData: SnippetRenderData;
			try {
				snippetData = await snippetProvider.getRenderData(node.attributes.id, context.parser);
			} catch {
				snippetData = { content: undefined, title: undefined, id: node.attributes.id };
			}
			if (snippetData.content) context.snippet.add(node.attributes.id);
			return new Tag("Snippet", snippetData, snippetData.content);
		},
	};
}
