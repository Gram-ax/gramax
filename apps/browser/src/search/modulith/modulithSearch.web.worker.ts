import { handleMessage } from "@ext/serach/modulith/search/worker/modulithSearch.base.worker";
import type { SearchWorkerInMessage } from "@ext/serach/modulith/search/worker/types";

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<SearchWorkerInMessage>) => {
	void handleMessage(event.data, (data) => ctx.postMessage(data));
});
