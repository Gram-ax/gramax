import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import { Command } from "../../../types/Command";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import fileNameUtils from "@core-ui/fileNameUtils";

const createFromPath: Command<
	{ resourcePath: Path; resourceName: string; catalogName: string; articlePath: Path; ctx: Context },
	{ newName: string }
> = Command.create({
	path: "article/resource/createFromPath",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ resourcePath, resourceName, catalogName, articlePath, ctx }) {
		const { hashes, wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(articlePath);
		const article = catalog.findItemByItemPath<Article>(itemRef.path);
		if (!article) return;

		const fs = new DiskFileProvider(resourcePath);
		const img = await fs.readAsBinary(new Path(resourceName));
		if (!img) return;
		const items = await fp.getItems(articlePath.parentDirectoryPath);
		const splitted = resourceName.split(".");
		const newName = new Path(
			fileNameUtils.getNewName(
				items.map((i) => "./" + i.name),
				splitted[splitted.length - 2],
				splitted[splitted.length - 1],
			),
		);

		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const hashItem = new HashResourceManager(newName, article.parsedContent.resourceManager);
		await article.parsedContent.resourceManager.setContent(newName, img);
		hashes.deleteHash(hashItem);
		return { newName: newName.toString() };
	},

	params(ctx, q, body) {
		const data = body;
		const resourcePath = new Path(q.resourcePath);
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const resourceName = q.resourceName;
		return { ctx, data, resourcePath, catalogName, articlePath, resourceName };
	},
});

export default createFromPath;
