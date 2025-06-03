import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { Node, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";

export function snippet(context: ParserContext): Schema {
	return {
		render: "Snippet",
		type: SchemaType.block,
		attributes: { id: { type: String } },

		transform: async (node: Node) => {
			const snippetProvider = context.getCatalog().customProviders.snippetProvider;
			let snippetData: SnippetRenderData;
			try {
				const snippet = snippetProvider.getArticle(node.attributes.id);

				if (snippet) {
					const newContext = context.createContext(snippet);
					snippetData = await snippetProvider.getRenderData(node.attributes.id, newContext);
				} else {
					snippetData = { content: undefined, title: undefined, id: node.attributes.id };
				}
			} catch {
				snippetData = { content: undefined, title: undefined, id: node.attributes.id };
			}
			if (snippetData.content) context.snippet.add(node.attributes.id);
			return new Tag("Snippet", snippetData, snippetData.content);
		},
	};
}
