import { handleMessage } from "@ext/serach/modulith/search/worker/modulithSearch.base.worker";
import type { SearchWorkerInMessage } from "@ext/serach/modulith/search/worker/types";

self.onmessage = (event: MessageEvent<SearchWorkerInMessage>) => {
	void handleMessage(event.data, (data) => postMessage(data));
};
