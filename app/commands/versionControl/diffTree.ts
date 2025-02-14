import { ResponseKind } from "@app/types/ResponseKind";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type { DiffCompareOptions } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitDiffItemCreatorLegacy from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreatorLegacy";
import RevisionDiffItemCreator from "@ext/git/core/GitDiffItemCreator/RevisionDiffItemCreator";
import RevisionDiffTreePresenter, { type DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import t from "@ext/localization/locale/translate";
import Navigation from "@ext/navigation/catalog/main/logic/Navigation";
import type { DiffItemResourceCollection } from "@ext/VersionControl/model/Diff";
import { Command } from "../../types/Command";

const diffTree: Command<{ catalogName: string; ctx: Context }, DiffItemResourceCollection | DiffTree> = Command.create({
	path: "versionControl/diffTree",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, ctx }) {
		const useNewDiff = getIsDevMode();

		const { sitePresenterFactory, wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;

		const fs = workspace.getFileStructure();
		const articleParser = new ArticleParser(ctx, parser, parserContextFactory);

		if (!useNewDiff) {
			const gitDiffItemCreator = new GitDiffItemCreatorLegacy(catalog, sitePresenterFactory.fromContext(ctx), fs);

			const diffItems = await gitDiffItemCreator.getDiffItems();

			if (diffItems.items.length == 0 && diffItems.resources.length == 0) {
				throw new DefaultError(
					t("git.warning.no-changes.body"),
					null,
					null,
					true,
					t("git.warning.no-changes.title"),
				);
			}

			return diffItems;
		}

		if (useNewDiff) {
			await catalog.repo.gvc.add();

			const head = await catalog.getHeadVersion();
			const diffOpts: DiffCompareOptions = {
				type: "index",
			};

			const gitDiffItemCreator = new RevisionDiffItemCreator(
				catalog,
				sitePresenterFactory.fromContext(ctx),
				fs,
				diffOpts,
				head,
				catalog,
				articleParser,
			);

			const diffItems = await gitDiffItemCreator.getDiffItems();

			const nav = new Navigation();
			const diffTreePresenter = new RevisionDiffTreePresenter({
				diffItems,
				newRoot: catalog.name,
				oldRoot: head.name,
				newItems: await nav.getCatalogNav(catalog, null),
				oldItems: await nav.getCatalogNav(head, null),
			});

			return diffTreePresenter.present();
		}
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default diffTree;
