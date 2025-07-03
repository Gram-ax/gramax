import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const imageTokenTransformer: TokenTransformerFunc = ({ token }) => {
	if (token.type === "image") {
		const attrs = Array.isArray(token.attrs?.[0]) ? Object.fromEntries(token.attrs) : token.attrs;
		return { type: "image", attrs };
	}
};

export default imageTokenTransformer;
