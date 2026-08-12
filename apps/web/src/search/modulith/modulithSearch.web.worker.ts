import {
	defaultGetIndexFactory,
	type HandlerContext,
	handleMessage,
} from "@ext/serach/modulith/search/worker/modulithSearch.base.worker";
import type { SearchWorkerInMessage } from "@ext/serach/modulith/search/worker/types";

const ctx = self as unknown as Worker;

const handlerContext: HandlerContext = {
	postMessage: (data) => ctx.postMessage(data),
	getIndexFactory: defaultGetIndexFactory,
};

ctx.addEventListener("message", (event: MessageEvent<SearchWorkerInMessage>) => {
	void handleMessage(event.data, handlerContext);
});
