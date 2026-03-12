import { handleMessage } from "@ext/serach/modulith/search/worker/modulithSearch.base.worker";
import type { SearchWorkerInMessage } from "@ext/serach/modulith/search/worker/types";
import { parentPort } from "worker_threads";

parentPort!.on("message", (data: SearchWorkerInMessage) => {
	void handleMessage(data, (data) => parentPort!.postMessage(data));
});
