import resolveBackendModule from "@app/resolveModule/backend";
import type { CreateSearcherManagerArgs } from "@ext/serach/createSearcherManager";
import { createModulithFileProviders, createModulithService } from "@ext/serach/modulith/createModulithService";
import ModulithChatBotSearcher from "@ext/serach/modulith/ModulithChatBotSearcher";
import { ModulithSearcher } from "@ext/serach/modulith/ModulithSearcher";
import { RemoteModulithSearchClient } from "@ext/serach/modulith/search/RemoteModulithSearchClient";
import SearcherManager from "@ext/serach/SearcherManager";

export const createSearcherManager = async ({
	config,
	wm,
	parser,
	parserContextFactory,
	searchResourcesEnabled,
}: CreateSearcherManagerArgs) => {
	const remoteModulithClient = config.portalAi.enabled
		? await RemoteModulithSearchClient.create({
				apiUrl: config.portalAi.apiUrl,
				apiKey: config.portalAi.token,
				collectionName: config.portalAi.instanceName,
			})
		: undefined;

	const aiAvailable = remoteModulithClient ? await remoteModulithClient.checkConnection() : false;

	const modulithClient = await resolveBackendModule("getModulithSearchClient")(
		createModulithFileProviders(config.paths.data),
	);

	const resourceParseClient = searchResourcesEnabled
		? await resolveBackendModule("getResourceParseClient")()
		: undefined;

	const modulithService = await createModulithService({
		wm,
		parser,
		parserContextFactory,
		resourceParseClient,
		localClient: modulithClient,
		remoteClient: aiAvailable ? remoteModulithClient : undefined,
		immediateIndexing: true,
		diagramRendererServerUrl: (await wm.current()?.config())?.services?.diagramRenderer?.url,
	});

	const searcherManager = new SearcherManager(
		new ModulithSearcher(modulithService),
		remoteModulithClient ? new ModulithChatBotSearcher(remoteModulithClient, wm) : undefined,
	);

	return { aiAvailable, searcherManager };
};
