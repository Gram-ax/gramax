import { getExecutingEnvironment } from "@app/resolveModule/env";
import rustCall from "@app/resolveModule/rustcall";
import { span } from "@ext/loggers/opentelemetry";
import type { WorkspacePath } from "./WorkspaceConfig";

let currentWatcherId: number | undefined;

export const watchWorkspace = async (path: WorkspacePath) => {
	if (currentWatcherId !== undefined) {
		try {
			await rustCall("fs.unwatch_workspace", { id: currentWatcherId });
		} catch (e) {
			span()?.recordException(e);
		}
		currentWatcherId = undefined;
	}

	if (getExecutingEnvironment() === "tauri") {
		try {
			currentWatcherId = await rustCall<number>("fs.watch_workspace", {
				scope: { kind: "disk", root: path },
				opts: {},
			});
		} catch (e) {
			span()?.recordException(e);
		}
	}
};
