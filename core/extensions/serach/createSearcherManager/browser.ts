import resolveBackendModule from "@app/resolveModule/backend";
import type { CreateSearcherManagerArgs } from "@ext/serach/createSearcherManager";
import { createModulithFileProviders, createModulithService } from "@ext/serach/modulith/createModulithService";
import { ModulithSearcher } from "@ext/serach/modulith/ModulithSearcher";
import SearcherManager from "@ext/serach/SearcherManager";

export const createSearcherManager = async ({
	parser,
	parserContextFactory,
	wm,
	config,
}: CreateSearcherManagerArgs) => {
	return new SearcherManager(
		new ModulithSearcher(
			await createModulithService({
				wm,
				parser,
				parserContextFactory,
				resourceParseClient: await resolveBackendModule("getResourceParseClient")(),
				localClient: await resolveBackendModule("getModulithSearchClient")(
					createModulithFileProviders(config.paths.data),
				),
				diagramRendererServerUrl: (await wm.maybeCurrent()?.config())?.services?.diagramRenderer?.url,
			}),
		),
	);
};
