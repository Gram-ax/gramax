import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import DbDiagram from "@core-ui/DbDiagram";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashItem from "@core/Hash/HashItems/HashItem";
import HashItemContent from "@core/Hash/HashItems/HashItemContent";
import { Command, ResponseKind } from "../../types/Command";

const getDbDiagram: Command<
	{
		ctx: Context;
		path: Path;
		articlePath: Path;
		catalogName: string;
		tags: string;
		lang: string;
		primary: string;
		shouldDraw: boolean;
	},
	{ hashItem: HashItem; mime: MimeTypes }
> = Command.create({
	path: "dbDiagram",

	kind: ResponseKind.blob,

	middlewares: [new MainMiddleware()],

	async do({ ctx, path, articlePath, catalogName, tags, lang, primary, shouldDraw }) {
		const { lib, tablesManager } = this._app;
		const diagram = new DbDiagram(tablesManager);

		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);

		const article = catalog.findItemByItemPath(articlePath) as Article;
		await parseContent(article, catalog, ctx, this._app.parser, this._app.parserContextFactory);
		const resourceManager = article.parsedContent.resourceManager;
		const diagramRef = fp.getItemRef(resourceManager.getAbsolutePath(path));

		const key = diagramRef.path.value + diagramRef.storageId;
		const hashItem = new HashItemContent(key, async () => {
			await diagram.addDiagram(diagramRef, tags, lang, resourceManager.rootPath, primary);
			return shouldDraw ? diagram.draw() : JSON.stringify(diagram.getData());
		});

		return {
			hashItem,
			mime: shouldDraw ? MimeTypes.png : MimeTypes.json,
		};
	},

	params(ctx, query) {
		return {
			ctx,
			lang: query.lang,
			tags: query.tags ?? "",
			primary: query.primary,
			path: new Path(query.path),
			catalogName: query.catalogName,
			shouldDraw: query.draw == "true",
			articlePath: new Path(query.articlePath),
		};
	},
});

export default getDbDiagram;
