/** biome-ignore-all lint/suspicious/noExplicitAny: idc */
import { healthcheckEvents } from "@ext/git/core/GitCommands/errors/HealthcheckEvents";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import { type CredsArgs, progress } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

void listen("remote-progress", (ev) => {
	const payload = ev.payload as any;
	progress[payload.data.id]?.(payload);
});

const parseError = (err: any) => {
	try {
		return typeof err === "string"
			? JSON.parse(err)
			: { message: err.message, subset: err.subset, class: err.class, code: err.code };
	} catch {
		return { message: err, subset: -1, class: -1, code: -1 };
	}
};

export const call = async <O>(command: string, args?: any): Promise<O> => {
	if (args?.scope === "HEAD") args.scope = null;
	try {
		if (command === "git_read_file") {
			const readRes = await fetch(convertFileSrc("", "gramax-gitfs-stream"), {
				method: "POST",
				body: JSON.stringify(args),
			});
			if (readRes.ok) return (await readRes.arrayBuffer()) as O;
			const err = await readRes.json();
			if (args?.creds?.accessToken) args.creds.accessToken = "<redacted>";
			const libGit2Error = new LibGit2Error(
				`git (${command}, ${err.subset ?? "<unknown subset>"}, ${err.class ?? "<unknown class>"}, ${
					err.code ?? "<unknown code>"
				})`,
				`${err.message?.trim() || err}\nArgs:${JSON.stringify(args, null, 4)}`,
				err.subset,
				err.class,
				err.code,
				command,
			);

			if (libGit2Error.code === GitErrorCode.HealthcheckFailed && args?.repoPath) {
				await healthcheckEvents.emit("healthcheck-failed", { repoPath: args.repoPath, error: libGit2Error });
			}

			throw libGit2Error;
		}

		return await invoke<O>(`plugin:plugin-gramax-git|${command}`, args);
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		const error = parseError(err);
		const libGit2Error = new LibGit2Error(
			`git (${command}, ${error.subset ?? "<unknown subset>"}, ${error.class ?? "<unknown class>"}, ${
				error.code ?? "<unknown code>"
			})`,
			`${error.message?.trim()}\nArgs: ${JSON.stringify(args, null, 4)}`,
			error.subset,
			error.class,
			error.code,
			command,
		);

		if (libGit2Error.code === GitErrorCode.HealthcheckFailed && args?.repoPath) {
			await healthcheckEvents.emit("healthcheck-failed", { repoPath: args.repoPath, error: libGit2Error });
		}

		throw libGit2Error;
	}
};
