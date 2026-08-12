import resolveBackendModule from "@app/resolveModule/backend";
import { span, traced } from "@ext/loggers/opentelemetry";
import type { CreateSearcherManagerArgs } from "@ext/serach/createSearcherManager";
import { createModulithFileProviders, createModulithService } from "@ext/serach/modulith/createModulithService";
import ModulithChatBotSearcher from "@ext/serach/modulith/ModulithChatBotSearcher";
import { ModulithSearcher } from "@ext/serach/modulith/ModulithSearcher";
import { RemoteSearchHealthChecker } from "@ext/serach/modulith/RemoteSearchHealthChecker";
import { RemoteModulithSearchClient } from "@ext/serach/modulith/search/RemoteModulithSearchClient";
import SearcherManager from "@ext/serach/SearcherManager";
import { UnavailableSearcher } from "@ext/serach/UnavailableSearcher";

export const createSearcherManager = async ({
	config,
	wm,
	parser,
	parserContextFactory,
	tablesManager,
	healthcheckRegistry,
}: CreateSearcherManagerArgs) => {
	const remoteModulithClient = config.portalAi.enabled
		? await RemoteModulithSearchClient.create({
				apiUrl: config.portalAi.apiUrl,
				apiKey: config.portalAi.token,
				collectionName: config.portalAi.instanceName,
			})
		: undefined;

	const aiAvailable = remoteModulithClient ? await remoteModulithClient.checkConnection() : false;

	const chatBotSearcher = remoteModulithClient ? new ModulithChatBotSearcher(remoteModulithClient, wm) : undefined;
	if (remoteModulithClient) healthcheckRegistry?.register(new RemoteSearchHealthChecker(remoteModulithClient));

	return await traced("node-search-create", async () => {
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
				remoteClient: aiAvailable ? remoteModulithClient : undefined,
				immediateIndexing: true,
				diagramRendererServerUrl: (await wm.current()?.config())?.services?.diagramRenderer?.url,
				tablesManager,
				resourceSearchEnabled: config.search.resourceSearchEnabled,
			});

			return {
				aiAvailable,
				searcherManager: new SearcherManager(new ModulithSearcher(modulithService), chatBotSearcher),
			};
		} catch (error) {
			span()?.recordException(error instanceof Error ? error : new Error(String(error)));
			span()?.addEvent("disabled", { capability: "local-search" });
			return {
				aiAvailable,
				searcherManager: new SearcherManager(new UnavailableSearcher(error), chatBotSearcher),
			};
		}
	});
};
