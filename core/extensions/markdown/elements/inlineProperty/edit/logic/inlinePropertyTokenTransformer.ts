import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const inlinePropertyTokenTransformer: TokenTransformerFunc = ({ token, transformer, parent }) => {
	if (token.tag == "inline-property" && !parent) return transformer.getParagraphTokens(null, [token]);
};

export default inlinePropertyTokenTransformer;
