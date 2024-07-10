import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const iconTokenTransformer: TokenTransformerFunc = ({ token, transformer, parent }) => {
	if (token.tag == "icon" && !parent)
		return transformer.getParagraphTokens(null, [{ type: token.tag, tag: "icon", attrs: token.attrs }]);
};

export default iconTokenTransformer;
