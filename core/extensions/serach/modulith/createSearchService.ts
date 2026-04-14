import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { FileFsProvider } from "@ext/serach/modulith/local/FileFsProvider";
import {
	FsCommitableArticleStorageProvider,
	FsCommitableSimpleArticleStorage,
} from "@ics/modulith-search-infra/article";
import {
	DefaultSearcher,
	DefaultSearchService,
	DefaultSearchTokenizer,
	SearchStore,
} from "@ics/modulith-search-infra/search";
import {
	CachedMemoryArticleRepo,
	CachedMemoryChunkRepo,
	CachedMemoryChunkSearchWordRepo,
	CachedMemoryChunkWordRepo,
	CachedMemoryDictWordRepo,
	CachedMemoryEmbLinkRepo,
	CachedMemoryTenantRepo,
} from "@ics/modulith-search-infra-memory";
import { Stemmer } from "@ics/modulith-search-infra-stemmer";
import { NullLogger } from "@ics/modulith-utils";
import { TENANT_NAME } from "./consts";

export interface ReposCache {
	get(key: string): Promise<Uint8Array | undefined>;
	set(key: string, data: Uint8Array): Promise<void>;
}

export const createSearchService = async ({
	cache,
	articleStorageFileProvider,
}: {
	cache: ReposCache;
	articleStorageFileProvider: FileProvider;
}): Promise<{ searchService: DefaultSearchService; commit: () => Promise<void> }> => {
	// `createArticleStorageProvider` may delete and recreate the target directory,
	// so it must be called before any code that relies on its contents
	const articleStorageProvider = await createArticleStorageProvider(articleStorageFileProvider);

	const { tenantRepo, articleRepo, chunkRepo, embLinkRepo, dictWordRepo, chunkWordRepo, chunkSearchWordRepo } =
		await createRepos(cache);

	const logger = new NullLogger();
	const tokenizer = await createTokenizer();

	const searchStore = new SearchStore({
		articleRepo,
		chunkRepo,
		tenantRepo,
		embLinkRepo,
		dictWordRepo,
		chunkWordRepo,
		chunkSearchWordRepo,
		logger,
		tokenizer,
	});

	const searchService = new DefaultSearchService({
		logger,
		searcher: new DefaultSearcher({
			tenantRepo,
			articleRepo,
			chunkRepo,
			embLinkRepo,
			dictWordRepo,
			chunkWordRepo,
			chunkSearchWordRepo,
			tokenizer,
		}),
		store: searchStore,
		articleStorageProvider,
	});

	return {
		searchService,
		commit: async () => {
			await Promise.all([
				chunkRepo.commit(),
				tenantRepo.commit(),
				articleRepo.commit(),
				embLinkRepo.commit(),
				dictWordRepo.commit(),
				chunkWordRepo.commit(),
				chunkSearchWordRepo.commit(),
				articleStorageProvider.commit(),
			]);
		},
	};
};

async function createArticleStorageProvider(fp: FileProvider) {
	const create = async () =>
		await FsCommitableArticleStorageProvider.create({
			fsProvider: new FileFsProvider(fp),
			storageFactory: (fs) =>
				FsCommitableSimpleArticleStorage.create({
					fsProvider: fs,
				}),
		});

	const cleanup = async () => {
		await fp.delete(new Path("."));
	};

	try {
		const storageProvider = await create();
		if (await needReindex(storageProvider)) {
			await cleanup();
			return await create();
		}

		return storageProvider;
	} catch (e) {
		console.warn("Error creating article storage provider; retrying after cleanup:", e);
		await cleanup();
		return await create();
	}
}

async function needReindex(storageProvider: FsCommitableArticleStorageProvider): Promise<boolean> {
	// New version has changed search indexing algorithm
	const tenant = await storageProvider.tryGet(TENANT_NAME);
	return tenant === undefined;
}

async function createTokenizer(): Promise<DefaultSearchTokenizer> {
	const stemmer = new Stemmer();
	return new DefaultSearchTokenizer({
		processTerm: (word) => {
			const stemmed = stemmer.stemWord({ word }).word;
			if (stemmed === word) {
				return [word];
			}

			return [stemmed, word];
		},
	});
}

const tenantCacheName = "tenant";
const articleCacheName = "article";
const chunkCacheName = "chunk";
const embLinkCacheName = "embLink";
const dictWordCacheName = "dictWord";
const chunkWordCacheName = "chunkWord";
const chunkSearchWordCacheName = "chunkSearchWord";

async function createRepos(cache: ReposCache): Promise<{
	tenantRepo: CachedMemoryTenantRepo;
	articleRepo: CachedMemoryArticleRepo;
	chunkRepo: CachedMemoryChunkRepo;
	embLinkRepo: CachedMemoryEmbLinkRepo;
	dictWordRepo: CachedMemoryDictWordRepo;
	chunkWordRepo: CachedMemoryChunkWordRepo;
	chunkSearchWordRepo: CachedMemoryChunkSearchWordRepo;
}> {
	const tenantSetCache = (v: Uint8Array) => cache.set(tenantCacheName, v);
	const articleSetCache = (v: Uint8Array) => cache.set(articleCacheName, v);
	const chunkSetCache = (v: Uint8Array) => cache.set(chunkCacheName, v);
	const embLinkSetCache = (v: Uint8Array) => cache.set(embLinkCacheName, v);
	const dictWordSetCache = (v: Uint8Array) => cache.set(dictWordCacheName, v);
	const chunkWordSetCache = (v: Uint8Array) => cache.set(chunkWordCacheName, v);
	const chunkSearchWordSetCache = (v: Uint8Array) => cache.set(chunkSearchWordCacheName, v);

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
			dictWordRepo: await CachedMemoryDictWordRepo.create({
				cachedValue: await cache.get(dictWordCacheName),
				setCache: dictWordSetCache,
			}),
			chunkWordRepo: await CachedMemoryChunkWordRepo.create({
				cachedValue: await cache.get(chunkWordCacheName),
				setCache: chunkWordSetCache,
			}),
			chunkSearchWordRepo: await CachedMemoryChunkSearchWordRepo.create({
				cachedValue: await cache.get(chunkSearchWordCacheName),
				setCache: chunkSearchWordSetCache,
			}),
		};
	} catch (e) {
		console.warn("Error creating repos; retrying with empty:", e);
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
			dictWordRepo: await CachedMemoryDictWordRepo.create({
				setCache: dictWordSetCache,
			}),
			chunkWordRepo: await CachedMemoryChunkWordRepo.create({
				setCache: chunkWordSetCache,
			}),
			chunkSearchWordRepo: await CachedMemoryChunkSearchWordRepo.create({
				setCache: chunkSearchWordSetCache,
			}),
		};
	}
}
