import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { ParseSpec } from "../../../../core/edit/logic/Prosemirror/from_markdown";
import CommentProvider from "../logic/CommentProvider";

function commentToken(context?: ParserContext): ParseSpec {
	const commentProvider = new CommentProvider(context.fp, context.getArticle().ref.path);

	return {
		mark: "comment",
		getAttrs: async (tok) => {
			if (!tok.attrs.count) return null;
			const rm = context.getResourceManager();
			rm.set(rm.rootPath.join(rm.basePath).getRelativePath(commentProvider.getFilePath()));
			return { ...tok.attrs, ...(await commentProvider.getComment(tok.attrs.count, context)) };
		},
	};
}

export default commentToken;
