import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";

const commentTokenTransformer: TokenTransformerFunc = ({ token, parent }) => {
	if (token?.tag === "comment" && parent?.type !== "inline") {
		if (token.type === "comment_open") {
			token.type = "comment_old_open";
			token.tag = "comment_old";
			token.attrs = { mail: token.attrs.count, dateTime: token.attrs.undefined };
		}
		if (token.type === "comment_close") {
			token.type = "comment_old_close";
			token.tag = "comment_old";
		}
	}
};

export default commentTokenTransformer;
