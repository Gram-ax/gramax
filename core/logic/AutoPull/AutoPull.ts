import type Application from "@app/types/Application";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type Library from "@core/Library/Library";
import type Logger from "@ext/loggers/Logger";

const DEFAULT_AUTO_PULL_INTERVAL = 180;

const autoPull = (app: Application) => {
	const logger = app.logger;
	if (!process.env.AUTO_PULL_TOKEN) return logger.logWarning("Disabling auto-pull, because token is not set");

	const pullInterval = (Number(process.env.AUTO_PULL_INTERVAL) ?? DEFAULT_AUTO_PULL_INTERVAL) * 1000;
	logger.logInfo(`Enabled auto-pull with pulling interval: ${pullInterval}`);

	const pullCatalog = async (catalog: CatalogEntry, logger: Logger) => {
		try {
			const catalogName = catalog.getName();
			if (!catalog || !catalog.repo.storage) return;

			const sourceData = {
				sourceType: await catalog.repo.storage.getType(),
				userEmail: "autopull",
				userName: "autopull",
				token: process.env.AUTO_PULL_TOKEN,
			};

			if (await catalog.repo.haveToPull({ data: sourceData })) {
				await catalog.repo.sync({
					data: sourceData,
					recursive: true,
					onPull: () => logger.logInfo(`Auto-pulled catalog "${catalogName}".`),
				});
			}
		} catch (error) {
			logger.logError(Error(`Error occurred while auto-pulling in "${catalog.getName()}" catalog: ${error}`));
		}
	};

	const pullCatalogs = async (lib: Library) => {
		const catalogEntries = Array.from(lib.getCatalogEntries().values());
		await Promise.all(catalogEntries.map((catalogEntry) => pullCatalog(catalogEntry, logger)));
		setTimeout(() => void pullCatalogs(app.lib), pullInterval);
	};

	setTimeout(() => void pullCatalogs(app.lib), pullInterval);
};

export default autoPull;
