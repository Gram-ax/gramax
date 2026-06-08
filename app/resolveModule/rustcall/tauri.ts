/** biome-ignore-all lint/suspicious/noExplicitAny: tauri InvokeArgs / error shapes vary */
import { isTauriMobile } from "@app/resolveModule/env";
import type { FsScope } from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import IoError from "@core/FileProvider/DiskFileProvider/DFPIOError";
import { healthcheckEvents } from "@ext/git/core/GitCommands/errors/HealthcheckEvents";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import { type CredsArgs, progress } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { span } from "@ext/loggers/opentelemetry";
import { convertFileSrc, type InvokeArgs } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "../../../apps/tauri/src/window/commands";
import { parseCommand } from "./index";

const otelHeaders = (): Record<string, string> => {
	const ctx = span()?.spanContext();
	if (!ctx?.spanId || !ctx?.traceId) return {};
	return { "span-id": ctx.spanId, "trace-id": ctx.traceId };
};

void listen("remote-progress", (ev) => {
	const payload = ev.payload as any;
	progress[payload.data.id]?.(payload);
});

const FS_CUSTOM_PROTOCOL_COMMANDS = isTauriMobile() ? ["read_file"] : ["read_file", "write_file"];

type FsArgs = InvokeArgs & { scope: FsScope; path: string };

const fsCustomProtocol = async <O>(cmd: string, args: FsArgs & { content?: Buffer; compress?: object }): Promise<O> => {
	const scope = args.scope;
	const relPath = args.path || ".";

	switch (cmd) {
		case "read_file": {
			const readRes = await fetch(convertFileSrc(relPath, "gx-fs"), {
				headers: { "x-fs-ctx": encodeURIComponent(JSON.stringify(scope)), ...otelHeaders() },
			});
			if (readRes.ok) return (await readRes.arrayBuffer()) as O;

			const readerr = await readRes.json();
			throw new IoError({
				name: "IO (gx-fs / read_file)",
				code: readerr.name,
				message: `${readerr.name}: ${readerr.message};\nargs: ${JSON.stringify(args, null, 4)}`,
			});
		}

		case "write_file": {
			const url = convertFileSrc(relPath, "gx-fs");
			const headers: Record<string, string> = {
				"x-fs-ctx": encodeURIComponent(JSON.stringify(scope)),
				...otelHeaders(),
			};
			if (args.compress) headers["x-compress"] = JSON.stringify(args.compress);

			const writeRes = await fetch(url, { method: "POST", body: args.content, headers });
			if (writeRes.ok) return;
			const writeerr = await writeRes.json();
			delete args.content;
			throw new IoError({
				name: "IO (gx-fs / write_file)",
				code: writeerr.name,
				message: `${writeerr.name}: ${writeerr.message};\nargs: ${JSON.stringify(args, null, 4)}`,
			});
		}
	}
};

const fsPluginInvoke = async <O>(cmd: string, args: FsArgs): Promise<O> => {
	try {
		return await invoke(`plugin:plugin-gramax-core|${cmd}`, args);
	} catch (err: any) {
		throw new IoError({
			name: `IO (${cmd})`,
			code: err?.name,
			message: `${err?.name}: ${err?.message};\nargs: ${JSON.stringify(args, null, 4)}`,
		});
	}
};

const callFs = async <O>(cmd: string, args: FsArgs): Promise<O> => {
	const scope = args?.scope;
	if (FS_CUSTOM_PROTOCOL_COMMANDS.includes(cmd) && scope) return fsCustomProtocol(cmd, args);
	return fsPluginInvoke(cmd, args);
};

const parseGitError = (err: any) => {
	try {
		return typeof err === "string"
			? JSON.parse(err)
			: { message: err.message, subset: err.subset, class: err.class, code: err.code };
	} catch {
		return { message: err, subset: -1, class: -1, code: -1 };
	}
};

const gitReadFileCustomProtocol = async <O>(args: any): Promise<O> => {
	const fsScope = encodeURIComponent(JSON.stringify({ kind: "git", repo: args.repoPath, scope: args.scope }));
	const url = convertFileSrc(encodeURIComponent(args.path), "gx-fs");
	const readRes = await fetch(url, { method: "GET", headers: { "x-fs-ctx": fsScope, ...otelHeaders() } });
	if (readRes.ok) return (await readRes.arrayBuffer()) as O;

	const err = await readRes.json();
	if (args?.creds?.accessToken) args.creds.accessToken = "<redacted>";
	const libGit2Error = new LibGit2Error(
		`git (git_read_file, ${err.subset ?? "<unknown subset>"}, ${err.class ?? "<unknown class>"}, ${
			err.code ?? "<unknown code>"
		})`,
		`${err.message?.trim() || err}\nArgs:${JSON.stringify(args, null, 4)}`,
		err.subset,
		err.class,
		err.code,
		"git_read_file",
	);

	if (libGit2Error.code === GitErrorCode.HealthcheckFailed && args?.repoPath) {
		await healthcheckEvents.emit("healthcheck-failed", { repoPath: args.repoPath, error: libGit2Error });
	}

	throw libGit2Error;
};

const callGit = async <O>(cmd: string, args: any = {}): Promise<O> => {
	if (args?.scope === "HEAD") args.scope = null;
	try {
		if (cmd === "git_read_file") return await gitReadFileCustomProtocol<O>(args);
		return await invoke<O>(`plugin:plugin-gramax-core|${cmd}`, args);
	} catch (err: any) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		const error = parseGitError(err);
		const libGit2Error = new LibGit2Error(
			`git (${cmd}, ${error.subset ?? "<unknown subset>"}, ${error.class ?? "<unknown class>"}, ${
				error.code ?? "<unknown code>"
			})`,
			`${error.message?.trim()}\nArgs: ${JSON.stringify(args, null, 4)}`,
			error.subset,
			error.class,
			error.code,
			cmd,
		);

		if (libGit2Error.code === GitErrorCode.HealthcheckFailed && args?.repoPath) {
			await healthcheckEvents.emit("healthcheck-failed", { repoPath: args.repoPath, error: libGit2Error });
		}

		throw libGit2Error;
	}
};

export const call = async <O>(command: string, args: any = {}): Promise<O> => {
	const [namespace, cmd] = parseCommand(command);
	return namespace === "git" ? callGit<O>(cmd, args) : callFs<O>(cmd, args);
};
