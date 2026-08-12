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
import { readFile as readDiskFile } from "fs/promises";
import { parentPort } from "worker_threads";

const handlerContext: HandlerContext = {
	isNode: true,
	postMessage: (message: ResourceParseWorkerOutMessage) => {
		parentPort!.postMessage(message);
	},
	readFile: async (source) => {
		try {
			return source.kind === "disk"
				? await readDiskFile(source.path)
				: await new RustFs(source.scope).readFile(source.path);
		} catch (error) {
			if (
				(error as NodeJS.ErrnoException).code === "ENOENT" ||
				(error instanceof LibGit2Error && error.code === GitErrorCode.FileNotFoundError)
			)
				return;
			throw error;
		}
	},
};

parentPort!.on("message", (msg: ResourceParseWorkerInMessage) => {
	void handleMessage(msg, handlerContext);
});
