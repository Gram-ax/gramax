import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const imageTokenTransformer: TokenTransformerFunc = ({ token, transformer }) => {
	if (token.tag == "image") {
		const attrs = token.attrs;
		return transformer.getParagraphTokens(null, [{ type: token.tag, tag: "img", attrs }]);
	}
};

export default imageTokenTransformer;
