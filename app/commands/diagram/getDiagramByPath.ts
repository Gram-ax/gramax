import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashItem from "@core/Hash/HashItems/HashItem";
import HashItemContent from "@core/Hash/HashItems/HashItemContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import DiagramType from "@core/components/Diagram/DiagramType";
import Diagrams from "@core/components/Diagram/Diagrams";
import { Command, ResponseKind } from "../../types/Command";

const getDiagramByPath: Command<
	{ ctx: Context; src: Path; articlePath: Path; catalogName: string; type: DiagramType; count?: number },
	{ hashItem: HashItem; mime: MimeTypes }
> = Command.create({
	path: "diagram/path",

	kind: ResponseKind.blob,

	middlewares: [new MainMiddleware()],

	async do({ ctx, src, articlePath, catalogName, type, count }) {
		const { lib, parser, parserContextFactory, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) return;
		const diagrams = new Diagrams(conf.enterpriseServerUrl);
		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const hash = new HashResourceManager(src, article.parsedContent.resourceManager);

		const hashItem: HashItem = new HashItemContent(
			hash.getKey(),
			async () => await diagrams.getDiagram(type, await hash.getContent(), +count),
			async () => await hash.getContent(),
		);

		return { hashItem, mime: diagrams.getDiagramMime(type) };
	},

	params(ctx, query) {
		return {
			ctx,
			src: new Path(query.path),
			catalogName: query.catalogName,
			type: query.diagram as DiagramType,
			count: Number.parseInt(query.count),
			articlePath: new Path(query.articlePath),
		};
	},
});

export default getDiagramByPath;
