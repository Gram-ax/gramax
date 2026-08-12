import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import {
	FsCommitableArticleStorageProvider,
	FsCommitableSimpleArticleStorage,
} from "@ics/article-search/article/storage/fs";
import type { IndexReader, IndexWriter } from "@ics/article-search/data/index";
import type { FsProvider } from "@ics/article-search/fs";
import {
	DefaultSearcher,
	DefaultSearchService,
	DefaultSearchTokenizer,
	IndexChunkStore,
	type SearchTokenizer,
} from "@ics/article-search/search";
import { Stemmer } from "@ics/article-search-stemmer";
import { NullLogger } from "@ics/article-search-utils";
import { TENANT_NAME } from "./consts";

export type IndexFactoryResult<TChunkId, TArticleId> = {
	reader: IndexReader<TChunkId, TArticleId>;
	writer: IndexWriter;
	commit: () => Promise<void>;
	close: () => Promise<void>;
};

export type IndexFactory<TChunkId, TArticleId> = (
	tokenizer: SearchTokenizer,
) => Promise<IndexFactoryResult<TChunkId, TArticleId>>;

export interface CreateSearchServiceArgs<TChunkId, TArticleId, TFileProvider extends FileProvider> {
	articleStorageFileProvider: TFileProvider;
	fs: FsProvider;
	indexFactory: IndexFactory<TChunkId, TArticleId>;
}

export type CreateSearchServiceResult = {
	searchService: DefaultSearchService;
	commit: () => Promise<void>;
};

export const createSearchService = async <TChunkId, TArticleId, TFileProvider extends FileProvider>(
	args: CreateSearchServiceArgs<TChunkId, TArticleId, TFileProvider>,
): Promise<CreateSearchServiceResult> => {
	const { articleStorageFileProvider, fs, indexFactory } = args;
	const tokenizer = await createTokenizer();

	// `createIndex` may delete and recreate the target directory,
	// so it must be called before any code that relies on its contents
	const { storageProvider: articleStorageProvider, index } = await createIndex(
		articleStorageFileProvider,
		fs,
		indexFactory,
		tokenizer,
	);

	const logger = new NullLogger();
	const searchService = new DefaultSearchService({
		logger,
		searcher: new DefaultSearcher({
			reader: index.reader,
			tokenizer,
		}),
		store: new IndexChunkStore(index.writer),
		articleStorageProvider,
	});

	return {
		searchService,
		commit: async () => {
			await Promise.all([index.commit(), articleStorageProvider.commit()]);
		},
	};
};

async function createIndex<TChunkId, TArticleId>(
	fp: FileProvider,
	fs: FsProvider,
	indexFactory: IndexFactory<TChunkId, TArticleId>,
	tokenizer: DefaultSearchTokenizer,
): Promise<{
	storageProvider: FsCommitableArticleStorageProvider;
	index: IndexFactoryResult<TChunkId, TArticleId>;
}> {
	const create = async () => ({
		storageProvider: await FsCommitableArticleStorageProvider.create({
			fsProvider: fs,
			storageFactory: (fs) =>
				FsCommitableSimpleArticleStorage.create({
					fsProvider: fs,
					indexedMetadataFields: ["wsPath", "catalogId", "lang", "type", "refPath", "articleId"],
				}),
		}),
		index: await indexFactory(tokenizer),
	});

	const cleanup = async () => {
		await fp.delete(new Path("."));
	};

	try {
		const res = await create();
		if (await needReindex(res.storageProvider)) {
			await res.index.close();
			await cleanup();
			return await create();
		}

		return res;
	} catch (e) {
		console.warn("Error opening search index; retrying after cleanup:", e);
		await cleanup();
		return await create();
	}
}

async function needReindex(storageProvider: FsCommitableArticleStorageProvider): Promise<boolean> {
	const tenant = await storageProvider.tryGet(TENANT_NAME);
	return tenant === undefined;
}

async function createTokenizer(): Promise<DefaultSearchTokenizer> {
	const stemmer = new Stemmer();
	return new DefaultSearchTokenizer({
		processTerm: (word) => {
			const stemmed = stemmer.stemWord(word);
			if (stemmed === word) {
				return [word];
			}

			return [stemmed, word];
		},
	});
}
