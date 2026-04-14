import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { ModulithService } from "@ext/serach/modulith/ModulithService";
import { SearchArticleParser } from "@ext/serach/modulith/parsing/SearchArticleParser";
import type { ResourceParseClient } from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type { ModulithSearchClient } from "@ext/serach/modulith/search/ModulithSearchClient";
import type { RemoteModulithSearchClient } from "@ext/serach/modulith/search/RemoteModulithSearchClient";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { CACHE_DIR, MODULITH_BASE } from "./consts";

export interface CreateModulithServiceArgs {
	wm: WorkspaceManager;
	parser: MarkdownParser;
	parserContextFactory: ParserContextFactory;
	resourceParseClient: ResourceParseClient | undefined;
	localClient: ModulithSearchClient;
	remoteClient?: RemoteModulithSearchClient;
	immediateIndexing?: boolean;
	diagramRendererServerUrl?: string;
}

export async function createModulithService({
	wm,
	parser,
	parserContextFactory,
	resourceParseClient,
	localClient,
	remoteClient,
	immediateIndexing,
	diagramRendererServerUrl,
}: CreateModulithServiceArgs): Promise<ModulithService> {
	const sap = new SearchArticleParser({
		parser,
		parserContextFactory,
		resourceParseClient,
		diagramRendererServerUrl,
		remoteVersion: remoteClient?.version,
	});
	const service = new ModulithService({
		localClient,
		remoteClient,
		wm,
		sap,
		immediateIndexing,
	});

	return service;
}

export function createModulithFileProviders(basePath: Path): {
	cacheFileProvider: FileProvider;
	articleStorageFileProvider: FileProvider;
} {
	const modulithBase = basePath.join(MODULITH_BASE);
	const modulithCacheBase = modulithBase.join(CACHE_DIR);

	return {
		cacheFileProvider: new DiskFileProvider(modulithCacheBase),
		articleStorageFileProvider: new DiskFileProvider(modulithBase),
	};
}
