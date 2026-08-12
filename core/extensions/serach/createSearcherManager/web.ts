import resolveBackendModule from "@app/resolveModule/backend";
import { span, traced } from "@ext/loggers/opentelemetry";
import type { CreateSearcherManagerArgs } from "@ext/serach/createSearcherManager";
import { createModulithFileProviders, createModulithService } from "@ext/serach/modulith/createModulithService";
import { ModulithSearcher } from "@ext/serach/modulith/ModulithSearcher";
import SearcherManager from "@ext/serach/SearcherManager";
import { UnavailableSearcher } from "@ext/serach/UnavailableSearcher";

export const createSearcherManager = async ({
	parser,
	parserContextFactory,
	wm,
	config,
	tablesManager,
}: CreateSearcherManagerArgs) => {
	return await traced("web-search-create", async () => {
		try {
			const localClient = await resolveBackendModule("getModulithSearchClient")(
				createModulithFileProviders(config.paths.data),
			);
			const resourceParseClient = await resolveBackendModule("getResourceParseClient")();
			const modulithService = await createModulithService({
				wm,
				parser,
				parserContextFactory,
				resourceParseClient,
				localClient,
				diagramRendererServerUrl: (await wm.maybeCurrent()?.config())?.services?.diagramRenderer?.url,
				tablesManager,
				resourceSearchEnabled: config.search.resourceSearchEnabled,
			});

			return new SearcherManager(new ModulithSearcher(modulithService));
		} catch (error) {
			span()?.recordException(error instanceof Error ? error : new Error(String(error)));
			span()?.addEvent("disabled", { capability: "local-search" });
			return new SearcherManager(new UnavailableSearcher(error));
		}
	});
};
