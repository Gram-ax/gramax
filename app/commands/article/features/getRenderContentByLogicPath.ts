import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import parseContent from "@core/FileStructue/Article/parseContent";
import Localizer from "@ext/localization/core/Localizer";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";

export interface RenderContent {
	title: string;
	content: RenderableTreeNodes;
	articlePath: string;
}

const getRenderContentByLogicPath: Command<{ ctx: Context; catalogName: string; logicPath: string }, RenderContent> =
	Command.create({
		path: "article/features/getRenderContentByLogicPath",
		kind: ResponseKind.json,

		async do({ ctx, catalogName, logicPath }) {
			const { parser, parserContextFactory, wm } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return null;

			const logic = Localizer.trim(logicPath, catalog.props.supportedLanguages);
			const article = catalog.findArticle(logic, []);
			if (!article) return null;

			await parseContent(article, catalog, ctx, parser, parserContextFactory);

			return {
				title: article.getTitle(),
				content: article.parsedContent.renderTree,
				articlePath: article.ref.path.value,
			};
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			return { ctx, catalogName, logicPath: q.logicPath };
		},
	});

export default getRenderContentByLogicPath;
