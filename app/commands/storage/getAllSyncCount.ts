import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import type Context from "@core/Context/Context";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";

type SyncCount = {
	pull?: number;
	push?: number;
	changed?: number;
	hasChanges?: boolean;
	errorMessage?: string;
};

type SyncCounts = {
	[catalogName: string]: SyncCount;
};

const getAllSyncCount: Command<{ ctx: Context; shouldFetch?: boolean; resetSyncCount?: boolean }, SyncCounts> =
	Command.create({
		path: "storage/getAllSyncCount",

		kind: ResponseKind.json,

		middlewares: [new SilentMiddleware(), new NetworkConnectMiddleWare(), new AuthorizeMiddleware()],

		async do({ ctx, shouldFetch, resetSyncCount }) {
			const { rp, wm } = this._app;
			const workspace = wm.current();

			const res = {};

			const entries = Array.from(workspace.getAllCatalogs().entries());

			await entries.forEachAsync(async ([name, entry]) => {
				if (!entry.repo?.storage) return;

				try {
					const data = rp.getSourceData(ctx, await entry.repo.storage.getSourceName());
					const invalidData = !data || data.isInvalid;

					if (invalidData) {
						res[name] = { errorMessage: t("storage-not-connected") };
						return;
					}

					if (shouldFetch) await entry.repo.storage.fetch(data, false, false);
					if (resetSyncCount) await entry.repo.storage.updateSyncCount();
					res[name] = await entry.repo.storage.getSyncCount();
				} catch (err) {
					if (res[name]) return;

					if (err instanceof LibGit2Error) {
						if (err.code === GitErrorCode.HealthcheckFailed) {
							res[name] = { errorMessage: t("git.error.broken.healthcheck.title") };
						}
					} else {
						res[name] = { errorMessage: t("unable-to-get-sync-count") };
					}
				}
			}, 2);

			return res;
		},

		params(ctx, q) {
			return { ctx, shouldFetch: q.fetch === "true" };
		},
	});

export default getAllSyncCount;
