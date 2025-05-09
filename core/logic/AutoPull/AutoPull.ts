import type Application from "@app/types/Application";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type Logger from "@ext/loggers/Logger";
import type { Workspace } from "@ext/workspace/Workspace";

const DEFAULT_AUTO_PULL_INTERVAL = 180;

const autoPull = async (app: Promise<Application>) => {
	const { logger, wm } = await app;
	if (!process.env.AUTO_PULL_TOKEN) return logger.logWarning("Disabling auto-pull, because token is not set");

	const pullInterval = (Number(process.env.AUTO_PULL_INTERVAL) || DEFAULT_AUTO_PULL_INTERVAL) * 1000;
	logger.logInfo(`Enabled auto-pull with pulling interval: ${pullInterval}`);

	const pullCatalog = async (catalog: BaseCatalog, logger: Logger) => {
		try {
			const catalogName = catalog.name;
			if (!catalog || !catalog.repo.storage) return;

			const sourceData = {
				sourceType: await catalog.repo.storage.getType(),
				userName: "autopull",
				gitServerUsername: process.env.AUTO_PULL_USERNAME || "autopull",
				userEmail: "autopull",
				token: process.env.AUTO_PULL_TOKEN,
			};

			if (await catalog.repo.isShouldSync({ data: sourceData, shouldFetch: true })) {
				await catalog.repo.sync({
					data: sourceData,
					recursivePull: true,
					onPull: () => logger.logInfo(`Auto-pulled catalog "${catalogName}".`),
				});
			}
		} catch (error) {
			console.log(Error(`Error occurred while auto-pulling in "${catalog.name}" catalog: ${error}`));
		}
	};

	const pullCatalogs = async (lib: Workspace) => {
		const catalogEntries = Array.from(lib.getAllCatalogs().values());
		await Promise.all(catalogEntries.map((catalogEntry) => pullCatalog(catalogEntry, logger)));
		setTimeout(() => void pullCatalogs(wm.current()), pullInterval);
	};

	setTimeout(() => void pullCatalogs(wm.current()), pullInterval);
};

export default autoPull;
