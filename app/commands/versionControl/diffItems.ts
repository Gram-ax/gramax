import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitDiffItemCreator from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreator";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";

const diffItems: Command<{ catalogName: string; ctx: Context }, { items: DiffItem[]; resources: DiffResource[] }> =
	Command.create({
		path: "versionControl/diffItems",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ catalogName, ctx }) {
			const { sitePresenterFactory, wm } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName);
			if (!catalog) return;
			const fp = workspace.getFileProvider();
			const fs = workspace.getFileStructure();
			const gitDiffItemCreator = new GitDiffItemCreator(catalog, fp, sitePresenterFactory.fromContext(ctx), fs);
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
