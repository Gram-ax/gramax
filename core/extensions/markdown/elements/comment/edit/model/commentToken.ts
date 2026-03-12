import type { ParseSpec } from "../../../../core/edit/logic/Prosemirror/from_markdown";
import type PrivateParserContext from "../../../../core/Parser/ParserContext/PrivateParserContext";

function commentToken(context?: PrivateParserContext): ParseSpec {
	return {
		mark: "comment",
		getAttrs: (tok) => {
			if (!tok.attrs.id || !context) return null;
			const rm = context.getResourceManager();
			const commentProvider = context.getCatalog().customProviders.commentProvider;
			const articlePath = context.getArticle().ref.path;

			commentProvider.assignComment(tok.attrs.id, articlePath);
			rm.set(rm.rootPath.join(rm.basePath).getRelativePath(commentProvider.getFilePath(articlePath)));

			return { ...tok.attrs };
		},
	};
}

export default commentToken;
