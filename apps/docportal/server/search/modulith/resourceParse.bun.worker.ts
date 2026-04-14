import {
	type HandlerContext,
	handleMessage,
} from "@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker";
import type {
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";

const handlerContext: HandlerContext = {
	isNode: true,
	postMessage: (message: ResourceParseWorkerOutMessage) => {
		postMessage(message);
	},
};

self.onmessage = (event: MessageEvent<ResourceParseWorkerInMessage>) => {
	void handleMessage(event.data, handlerContext);
};
