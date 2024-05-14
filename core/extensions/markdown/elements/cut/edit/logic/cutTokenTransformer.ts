import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const cutTokenTransformer: TokenTransformerFunc = ({ token, parent }) => {
	if (token && token.tag === "cut" && parent?.type === "inline") {
		if (token.type === "cut_open") {
			token.type = "inlineCut_open";
			token.tag = "inlineCut";
		}
		if (token.type === "cut_close") {
			token.type = "inlineCut_close";
			token.tag = "inlineCut";
		}
	}
};

export default cutTokenTransformer;
