import { STORAGE_DIR_NAME } from "@app/config/const";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import Cache from "@ext/Cache";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { AggregateModulithSearchClient } from "@ext/serach/modulith/AggregateModulithSearchClient";
import { FileFsProvider } from "@ext/serach/modulith/local/FileFsProvider";
import { LocalModulithSearchClient } from "@ext/serach/modulith/LocalModulithSearchClient";
import { ModulithSearchClient } from "@ext/serach/modulith/ModulithSearchClient";
import { ModulithService } from "@ext/serach/modulith/ModulithService";
import { SearchArticleParser } from "@ext/serach/modulith/parsing/SearchArticleParser";
import { RemoteModulithSearchClient } from "@ext/serach/modulith/RemoteModulithSearchClient";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { FuseSearcher } from "@ics/modulith-search-infra-fuse";
import {
	CachedMemoryArticleRepo,
	CachedMemoryChunkRepo,
	CachedMemoryTenantRepo,
	CachedMemoryEmbLinkRepo,
} from "@ics/modulith-search-infra-memory";
import { FsArticleStorageProvider, FsArticleStorage } from "@ics/modulith-search-infra/article";
import { ChunkStore } from "@ics/modulith-search-infra/chunking";
import { SearchStore, DefaultSearchService } from "@ics/modulith-search-infra/search";
import { NullLogger } from "@ics/modulith-utils";

export interface CreateModulithServiceArgs {
	basePath: Path;
	wm: WorkspaceManager;
	parser: MarkdownParser;
	parserContextFactory: ParserContextFactory;
	remoteClient?: RemoteModulithSearchClient;
	parseResources: boolean;
}

export async function createModulithService({
	basePath,
	wm,
	parser,
	parserContextFactory,
	remoteClient,
	parseResources,
}: CreateModulithServiceArgs): Promise<ModulithService> {
	const modulithBase = basePath.join(new Path(`${STORAGE_DIR_NAME}/.modulith`));

	const modulithCacheBase = modulithBase.join(new Path(".cache"));
	const modulithCache = new Cache(new DiskFileProvider(modulithCacheBase));
	const { tenantRepo, articleRepo, chunkRepo, embLinkRepo } = await createRepos(modulithCache);

	const logger = new NullLogger();

	const chunkStore = new SearchStore({
		articleRepo,
		chunkRepo,
		tenantRepo,
		embLinkRepo,
		logger,
	});

	const storeWrapper: ChunkStore = {
		update: async (args) => {
			const res = await chunkStore.update(args);
			await Promise.all([tenantRepo.commit(), articleRepo.commit(), chunkRepo.commit(), embLinkRepo.commit()]);

			return res;
		},
	};

	const articleStorageProvider = await FsArticleStorageProvider.create({
		fsProvider: new FileFsProvider(new DiskFileProvider(modulithBase)),
		storageFactory: (fs) => FsArticleStorage.create(fs),
	});

	let modulithClient: ModulithSearchClient = new LocalModulithSearchClient({
		searchService: new DefaultSearchService({
			logger,
			searcher: new FuseSearcher({
				tenantRepo,
				articleRepo,
				chunkRepo,
				embLinkRepo,
			}),
			store: storeWrapper,
			articleStorageProvider,
		}),
	});

	let immediateIndexing = false;

	if (remoteClient) {
		immediateIndexing = true;
		modulithClient = new AggregateModulithSearchClient(modulithClient, remoteClient);
	}

	const sap = new SearchArticleParser(parser, parserContextFactory, parseResources);
	const service = new ModulithService({
		client: modulithClient,
		wm,
		sap,
		immediateIndexing,
	});

	return service;
}

const tenantCacheName = "tenant";
const articleCacheName = "article";
const chunkCacheName = "chunk";
const embLinkCacheName = "embLink";

async function createRepos(cache: Cache): Promise<{
	tenantRepo: CachedMemoryTenantRepo;
	articleRepo: CachedMemoryArticleRepo;
	chunkRepo: CachedMemoryChunkRepo;
	embLinkRepo: CachedMemoryEmbLinkRepo;
}> {
	const tenantSetCache = (v: string) => cache.set(tenantCacheName, v);
	const articleSetCache = (v: string) => cache.set(articleCacheName, v);
	const chunkSetCache = (v: string) => cache.set(chunkCacheName, v);
	const embLinkSetCache = (v: string) => cache.set(embLinkCacheName, v);

	try {
		return {
			tenantRepo: await CachedMemoryTenantRepo.create({
				cachedValue: await cache.get(tenantCacheName),
				setCache: tenantSetCache,
			}),
			articleRepo: await CachedMemoryArticleRepo.create({
				cachedValue: await cache.get(articleCacheName),
				setCache: articleSetCache,
			}),
			chunkRepo: await CachedMemoryChunkRepo.create({
				cachedValue: await cache.get(chunkCacheName),
				setCache: chunkSetCache,
			}),
			embLinkRepo: await CachedMemoryEmbLinkRepo.create({
				cachedValue: await cache.get(embLinkCacheName),
				setCache: embLinkSetCache,
			}),
		};
	} catch {
		return {
			tenantRepo: await CachedMemoryTenantRepo.create({
				setCache: tenantSetCache,
			}),
			articleRepo: await CachedMemoryArticleRepo.create({
				setCache: articleSetCache,
			}),
			chunkRepo: await CachedMemoryChunkRepo.create({
				setCache: chunkSetCache,
			}),
			embLinkRepo: await CachedMemoryEmbLinkRepo.create({
				setCache: embLinkSetCache,
			}),
		};
	}
}
