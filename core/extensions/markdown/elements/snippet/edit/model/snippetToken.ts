import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";

const snippetToken = (context?: PrivateParserContext): ParseSpec => {
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
				context.snippet.add(tok.attrs.id);
			} catch {
				snippetData = { content: null, title: null, id: tok.attrs.id };
			}
			return snippetData;
		},
	};
};
export default snippetToken;
