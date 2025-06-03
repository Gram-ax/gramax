import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";

const snippetToken = (context?: ParserContext): ParseSpec => {
	return {
		node: "snippet",
		getAttrs: async (tok) => {
			if (!context) return { content: null, title: null, id: tok.attrs.id };
			const snippetProvider = context.getCatalog().customProviders.snippetProvider;
			let snippetData: SnippetRenderData;
			try {
				const snippet = snippetProvider.getArticle(tok.attrs.id);
				if (!snippet) return { content: null, title: null, id: tok.attrs.id };

				const newContext = context.createContext(snippet);
				snippetData = await snippetProvider.getRenderData(tok.attrs.id, newContext);
			} catch {
				snippetData = { content: null, title: null, id: tok.attrs.id };
			}
			return snippetData;
		},
	};
};
export default snippetToken;
