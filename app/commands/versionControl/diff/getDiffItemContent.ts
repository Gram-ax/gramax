import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import {
	DiffItemContentData,
	DiffItemContentScope,
} from "@ext/git/core/GitDiffItemCreator/DiffItemContent/DiffItemContent";
import assert from "assert";

const getDiffTree: Command<
	{ catalogName: string; ctx: Context; scope: DiffItemContentScope; filePath: Path; isResource: boolean },
	DiffItemContentData
> = Command.create({
	path: "versionControl/diff/getDiffItemContent",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, ctx, scope, filePath, isResource }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog?.repo.gvc);

		const articleParser = new ArticleParser(ctx, parser, parserContextFactory);
		const diffContent = await catalog.repo.diffItemContent.getContent(scope, filePath, articleParser, isResource);

		return diffContent;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const scope = JSON.parse(q.scope) as DiffItemContentScope;
		const filePath = new Path(q.filePath);
		const isResource = q.isResource === "true";
		return { ctx, catalogName, scope, filePath, isResource };
	},
});

export default getDiffTree;
