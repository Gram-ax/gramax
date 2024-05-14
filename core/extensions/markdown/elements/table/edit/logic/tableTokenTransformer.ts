import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const tableTokenTransformer: TokenTransformerFunc = ({ token }) => {
	if (token.tag) {
		if (token.tag === "tbody" || token.tag === "thead") return null;
		if (token.tag === "tr") {
			token.type = "tableRow" + token.type.slice(2);
			token.tag = "tableRow";
		}
		if (token.tag === "td") {
			token.type = "tableCell" + token.type.slice(2);
			token.tag = "tableCell";
		}
		if (token.tag === "th") {
			token.type = "tableHeader" + token.type.slice(2);
			token.tag = "tableHeader";
		}
	}
};

export default tableTokenTransformer;
