import { type HandlerContext, handleMessage } from "@ext/serach/modulith/search/worker/modulithSearch.base.worker";
import type { SearchWorkerInMessage } from "@ext/serach/modulith/search/worker/types";
import type { SqliteArticleIndexArticleId, SqliteArticleIndexChunkId } from "@ics/article-search-sqlite";
import { openSqliteIndex } from "@ics/article-search-sqlite/node";
import { parentPort } from "worker_threads";

const handlerContext: HandlerContext<SqliteArticleIndexChunkId, SqliteArticleIndexArticleId> = {
	postMessage: (data) => parentPort!.postMessage(data),
	getIndexFactory: ({ indexFile }) => {
		return async (tokenizer) => {
			const index = openSqliteIndex(indexFile.toString(), tokenizer, {
				cacheSizeKib: -262144, // 256MB (in KB)
				walSizeLimitBytes: 268435456, // 256MB
			});
			return {
				reader: index,
				writer: index,
				commit: () => index.commit(),
				close: async () => {
					await index.commit();
					index.close();
				},
			};
		};
	},
};

parentPort!.on("message", (data: SearchWorkerInMessage) => {
	void handleMessage(data, handlerContext);
});
