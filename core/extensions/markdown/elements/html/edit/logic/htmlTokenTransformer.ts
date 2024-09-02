import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const htmlTokenTransformer: TokenTransformerFunc = ({ token }) => {
	if (token.type === "tag" && token.meta.tag === "html") {
		return { ...token, type: "Html" };
	}
};

export default htmlTokenTransformer;
