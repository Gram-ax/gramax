import { onCloneProgress, type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import { InvokeArgs, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

void listen("clone-progress", (ev) => {
	const payload = ev.payload as any;
	onCloneProgress?.(payload);
});

export const call = async <O>(command: string, args?: InvokeArgs): Promise<O> => {
	try {
		return await invoke<O>(`plugin:plugin-gramax-git|${command}`, args);
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		console.error(`git-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(err);
		const error = typeof err === "string" ? JSON.parse(err) : err;
		throw new LibGit2Error(error.message, error.class, error.code);
	}
};
