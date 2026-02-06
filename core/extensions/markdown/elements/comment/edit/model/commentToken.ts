import { ParseSpec } from "../../../../core/edit/logic/Prosemirror/from_markdown";
import PrivateParserContext from "../../../../core/Parser/ParserContext/PrivateParserContext";

function commentToken(context?: PrivateParserContext): ParseSpec {
	return {
		mark: "comment",
		getAttrs: (tok) => {
			if (!tok.attrs.id || !context) return null;
			const rm = context.getResourceManager();
			rm.set(
				rm.rootPath
					.join(rm.basePath)
					.getRelativePath(
						context.getCatalog().customProviders.commentProvider.getFilePath(context.getArticle().ref.path),
					),
			);
			return { ...tok.attrs };
		},
	};
}

export default commentToken;
