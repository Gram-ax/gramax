import Path from "../../../../../logic/FileProvider/Path/Path";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import PrivateParserContext from "../../../core/Parser/ParserContext/PrivateParserContext";
import { Node, Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";

export function include(context: PrivateParserContext): Schema {
	return {
		render: "Include",
		attributes: {
			path: { type: String },
			gratings: { type: String },
		},
		type: SchemaType.block,
		transform: async (node: Node) => {
			const path = new Path(node.attributes.path);
			const gratings: string = node.attributes.gratings ? node.attributes.gratings : "##";

			if (!path.extension) path.extension = "md";

			context.getLinkManager().set(path);
			const childPath = context.getArticle().ref.path.parentDirectoryPath.join(path);
			const article = context.getItemByPath(childPath) as Article;
			if (!article) {
				return new Tag("Error", {
					error: { message: "The path specified in the include is not correct" },
					isLogged: context.getIsLogged(),
					lang: context.getLanguage(),
				});
			}

			const header = article?.getTitle() ? `${gratings} ${article.getTitle()}\r\n\r\n` : "";
			const content = await context.parser.parse(header + (article?.content ?? ""), context);

			return new Tag("Include", { path: article.ref.path.value }, (content.renderTree as Tag).children);
		},
	};
}
