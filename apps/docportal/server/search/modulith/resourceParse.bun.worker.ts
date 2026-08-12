import { RustFs } from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import {
	type HandlerContext,
	handleMessage,
} from "@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker";
import type {
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import { Buffer } from "buffer";
import { configurePdfWorker } from "./pdfWorker";

configurePdfWorker();

const handlerContext: HandlerContext = {
	isNode: true,
	postMessage: (message: ResourceParseWorkerOutMessage) => {
		postMessage(message);
	},
	readFile: async (source) => {
		try {
			if (source.kind === "git") return await new RustFs(source.scope).readFile(source.path);

			const file = Bun.file(source.path);
			if (!(await file.exists())) return;
			return Buffer.from(await file.arrayBuffer());
		} catch (error) {
			if (error instanceof LibGit2Error && error.code === GitErrorCode.FileNotFoundError) return;
			throw error;
		}
	},
};

self.onmessage = (event: MessageEvent<ResourceParseWorkerInMessage>) => {
	void handleMessage(event.data, handlerContext);
};
