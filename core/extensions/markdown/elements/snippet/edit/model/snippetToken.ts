import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import SnippetRenderData from "@ext/markdown/elements/snippet/model/SnippetRenderData";

const snippetToken = (context?: ParserContext): ParseSpec => {
	return {
		node: "snippet",
		getAttrs: async (tok) => {
			if (!context) return { content: null, title: null, id: tok.attrs.id };
			const snippetProvider = context.getCatalog().snippetProvider;
			let snippetData: SnippetRenderData;
			try {
				snippetData = await snippetProvider.getRenderData(tok.attrs.id, context.parser);
			} catch {
				snippetData = { content: null, title: null, id: tok.attrs.id };
			}
			return snippetData;
		},
	};
};
export default snippetToken;
