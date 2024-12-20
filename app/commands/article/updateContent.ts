import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";

const updateContent: Command<
	{ ctx: Context; articlePath: Path; catalogName: string; editTree: JSONContent },
	{ status: FileStatus }
> = Command.create({
	path: "article/updateContent",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, articlePath, catalogName, editTree }) {
		const { formatter, parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) return;

		const context = parserContextFactory.fromArticle(
			article,
			catalog,
			convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
			ctx.user.isLogged,
		);
		const markdown = await formatter.render(editTree, context);
		await article.updateContent(markdown);
		article.parsedContent = await parser.parse(article.content, context);

		// TODO: вынести в другое место; пока хз куда
		if (getExecutingEnvironment() != "next" && getIsDevMode()) {
			const relativePath = catalog.getRepositoryRelativePath(article.ref.path);
			let status = catalog.repo?.gvc ? await catalog.repo.gvc.getFileStatus(relativePath) : null;

			if (catalog.repo?.gvc && status?.status == FileStatus.current) {
				const rc = article.parsedContent?.resourceManager;
				if (rc) {
					const paths = rc.resources.map((p) =>
						catalog.getRepositoryRelativePath(rc.getAbsolutePath(p)),
					);
					for (const path of paths) {
						const resourceStatus = await catalog.repo.gvc.getFileStatus(path);
						if (resourceStatus) {
							status = resourceStatus;
							break;
						}
					}
				}
			}
			return { status: status?.status };
		}
	},

	params(ctx, q, body) {
		const articlePath = new Path(q.path);
		const catalogName = q.catalogName;
		const editTree = body as JSONContent;
		return { ctx, articlePath, catalogName, editTree };
	},
});

export default updateContent;
