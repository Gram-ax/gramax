import type Application from "@app/types/Application";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { span, trace } from "@ext/loggers/opentelemetry";
import SourceDataCtx from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type { Workspace } from "@ext/workspace/Workspace";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

const DEFAULT_AUTO_PULL_INTERVAL = 180;
const DEFAULT_AUTO_PULL_DELAY = 100;

export class AutoPull {
	private _wm: WorkspaceManager;
	private _pullInterval: number;
	private _pullDelay: number;

	@trace()
	async start(app: Promise<Application>): Promise<void> {
		const { logger, wm } = await app;

		const activeSpan = span();

		if (!process.env.AUTO_PULL_TOKEN) {
			activeSpan
				? activeSpan.addEvent("auto-pull", { status: "disabled", reason: "no token set" })
				: logger.logWarning("AUTO_PULL_TOKEN is not set. Auto-pull is disabled");

			return;
		}

		this._wm = wm;
		this._pullInterval = (Number(process.env.AUTO_PULL_INTERVAL) || DEFAULT_AUTO_PULL_INTERVAL) * 1000;
		this._pullDelay = Number(process.env.AUTO_PULL_DELAY) || DEFAULT_AUTO_PULL_DELAY;

		activeSpan
			? activeSpan.addEvent("auto-pull", {
					status: "enabled",
					interval: this._pullInterval,
					delay: this._pullDelay,
				})
			: console.log(`Auto pull enabled with interval: ${this._pullInterval}s`);

		setTimeout(() => void this._pullCatalogs(this._wm.current()), this._pullInterval);
	}

	@trace()
	private async _pullCatalog(catalog: BaseCatalog): Promise<void> {
		try {
			if (!catalog?.repo?.storage) return;

			const sourceData = SourceDataCtx.init(
				{
					sourceType: await catalog.repo.storage.getType(),
					userName: "autopull",
					gitServerUsername: process.env.AUTO_PULL_USERNAME || "autopull",
					userEmail: "autopull",
					token: process.env.AUTO_PULL_TOKEN,
				} as GitSourceData satisfies SourceData,
				null,
				null,
			);

			if (await catalog.repo.isShouldSync({ data: sourceData, shouldFetch: true })) {
				await catalog.repo.sync({
					data: sourceData,
					onPull: () =>
						span()
							? span().addEvent("pull", { catalog: catalog.name, status: "success" })
							: console.log(`Auto-pulled catalog "${catalog.name}".`),
				});
			} else {
				span()?.addEvent("pull", { catalog: catalog.name, status: "skip" });
			}
		} catch (error) {
			span()
				? span().addEvent("pull", { catalog: catalog.name, status: "error", message: String(error) })
				: console.error(`Error occurred while auto-pulling in "${catalog.name}" catalog: ${error}`);
		}
	}

	private async _pullCatalogs(workspace: Workspace): Promise<void> {
		const catalogEntries = Array.from(workspace.getAllCatalogs().values());
		for (const catalogEntry of catalogEntries) {
			await this._pullCatalog(catalogEntry);
			await new Promise((r) => setTimeout(r, this._pullDelay));
		}
		setTimeout(() => void this._pullCatalogs(this._wm.current()), this._pullInterval);
	}
}

const initAutoPull = async (app: Promise<Application>): Promise<void> => {
	await new AutoPull().start(app);
};

export default initAutoPull;
