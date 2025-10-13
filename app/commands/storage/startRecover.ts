import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import type StorageData from "@ext/storage/models/StorageData";
import assert from "assert";
import { Command } from "../../types/Command";

const startRecover: Command<
	{
		ctx: Context;
		catalogName: string;
	},
	{ started: boolean }
> = Command.create({
	path: "storage/startRecover",

	kind: ResponseKind.json,

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName }) {
		const workspace = await this._app.wm.currentOrDefault();
		const { rp } = this._app;

		const catalog = await workspace.getCatalog(catalogName, ctx);

		assert(catalog, `catalog ${catalogName} doesn't exist`);

		let storageData: StorageData;
		try {
			const sourceName = await catalog.repo.storage.getSourceName();
			const sourceData = rp.getSourceData(ctx, sourceName);
			storageData = await catalog.repo.storage.getStorageData(sourceData);
		} catch (e) {
			console.error(`failed to get storage data of broken repository`, catalogName, e);
			return { started: false };
		}

		assert(storageData, "StorageData is required");
		assert(
			isGitSourceType(storageData?.source?.sourceType),
			`storageData.source.sourceType must be SourceType.git; got ${storageData?.source?.sourceType}`,
		);
		assert(catalog.repo instanceof BrokenRepository, "catalog.repo must be an instance of BrokenRepository");

		void rp.recover(catalog.repo, storageData, async () => {
			await catalog.deref.update();
			return false;
		});

		return { started: true };
	},

	params(ctx, q) {
		return {
			ctx,
			catalogName: q.catalogName,
		};
	},
});

export default startRecover;
