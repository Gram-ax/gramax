import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitDiffItemCreator from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreator";
import { Command } from "../../types/Command";

const diffItems: Command<{ catalogName: string; ctx: Context }, { items: DiffItem[]; resources: DiffResource[] }> =
	Command.create({
		path: "versionControl/diffItems",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ catalogName, ctx }) {
			const { lib, sitePresenterFactory } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog) return;
			const fp = lib.getFileProviderByCatalog(catalog);
			const fs = lib.getFileStructureByCatalog(catalog);
			const gitDiffItemCreator = new GitDiffItemCreator(catalog, fp, sitePresenterFactory.fromContext(ctx), fs);
			const diffItems = await gitDiffItemCreator.getDiffItems();
			if (diffItems.items.length == 0 && diffItems.resources.length == 0) {
				throw new DefaultError(null, null, { errorCode: "noChanges" });
			}
			return diffItems;
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			return { ctx, catalogName };
		},
	});

export default diffItems;
