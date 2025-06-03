import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const htmlTagTokenTransformer: TokenTransformerFunc = ({ token, transformer, parent }) => {
	if ((token.tag == "selfClosingHtmlTag" || token.tag == "inlineHtmlTag") && !parent)
		return transformer.getParagraphTokens(null, [{ type: token.tag, tag: token.tag, attrs: token.attrs }]);
};

export default htmlTagTokenTransformer;
