import { onCloneProgress, type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

void listen("clone-progress", (ev) => {
	const payload = ev.payload as any;
	onCloneProgress?.(payload);
});

export const call = async <O>(command: string, args?: any): Promise<O> => {
	if (args?.scope === "HEAD") args.scope = null;
	try {
		if (command == "git_read_file") {
			const readRes = await fetch(convertFileSrc("", "gramax-gitfs-stream"), {
				method: "POST",
				body: JSON.stringify(args),
			});
			if (readRes.ok) return (await readRes.arrayBuffer()) as O;
			const err = await readRes.json();
			if (args?.creds?.accessToken) args.creds.accessToken = "<redacted>";
			throw new LibGit2Error(
				`git (${command})`,
				`${err.message?.trim()}\nArgs:${JSON.stringify(args, null, 4)}`,
				err.class,
				err.code,
			);
		}

		return await invoke<O>(`plugin:plugin-gramax-git|${command}`, args);
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		const error = typeof err === "string" ? JSON.parse(err) : err;
		throw new LibGit2Error(
			`git (${command})`,
			`${error.message?.trim()}\nArgs: ${JSON.stringify(args, null, 4)}`,
			error.class,
			error.code,
		);
	}
};
