import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const inlineImageTokenTransformer: TokenTransformerFunc = ({ token, parent, transformer }) => {
	if (token.type === "inlineImage" && !parent) {
		const attrs = Array.isArray(token.attrs?.[0]) ? Object.fromEntries(token.attrs) : token.attrs;
		return transformer.getParagraphTokens(null, [{ type: "inlineImage", attrs }]);
	}

	if (parent && token.type === "image" && parent?.children?.length >= 3) {
		const attrs = Array.isArray(token.attrs?.[0]) ? Object.fromEntries(token.attrs) : token.attrs;
		return { type: "inlineImage", attrs };
	}
};

export default inlineImageTokenTransformer;
