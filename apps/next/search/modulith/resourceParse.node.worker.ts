import {
	type HandlerContext,
	handleMessage,
} from "@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker";
import type {
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import { parentPort } from "worker_threads";

const handlerContext: HandlerContext = {
	isNode: true,
	postMessage: (message: ResourceParseWorkerOutMessage) => {
		parentPort!.postMessage(message);
	},
};

parentPort!.on("message", (msg: ResourceParseWorkerInMessage) => {
	void handleMessage(msg, handlerContext);
});
