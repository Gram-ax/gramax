import { ResponseKind } from "@app/types/ResponseKind";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitDiffItemCreator from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreator";
import GitDiffItemCreatorNew from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreatorNew";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";

const diffItems: Command<{ catalogName: string; ctx: Context }, { items: DiffItem[]; resources: DiffResource[] }> =
	Command.create({
		path: "versionControl/diffItems",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ catalogName, ctx }) {
			const IS_DEV_MODE = getIsDevMode();
			const { sitePresenterFactory, wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName);

			if (!catalog) return;
			const fs = workspace.getFileStructure();

			const articleParser = new ArticleParser(ctx, parser, parserContextFactory);
			const gitDiffItemCreator = IS_DEV_MODE
				? new GitDiffItemCreatorNew(catalog, sitePresenterFactory.fromContext(ctx), fs, articleParser)
				: new GitDiffItemCreator(catalog, fs.fp, sitePresenterFactory.fromContext(ctx), fs);

			const diffItems = await gitDiffItemCreator.getDiffItems();
			if (diffItems.items.length == 0 && diffItems.resources.length == 0) {
				throw new DefaultError(t("no-changes-in-catalog"), null, null, true);
			}
			return diffItems;
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			return { ctx, catalogName };
		},
	});

export default diffItems;
