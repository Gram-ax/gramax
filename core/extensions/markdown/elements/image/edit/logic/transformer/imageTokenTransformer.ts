import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const imageTokenTransformer: TokenTransformerFunc = ({ token }) => {
	if (token.type === "image" && Array.isArray(token.attrs?.[0])) {
		const attrs = Object.fromEntries(token.attrs);
		return { type: "image", attrs };
	}
};

export default imageTokenTransformer;
