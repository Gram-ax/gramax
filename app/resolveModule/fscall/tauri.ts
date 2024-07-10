import IoError from "@core/FileProvider/DiskFileProvider/DFPIOError";
import { InvokeArgs, convertFileSrc, invoke } from "@tauri-apps/api/core";

const CUSTOM_PROTOCOL_COMMANDS = ["read_file", "write_file"];

const callAsCustomProtocol = async <O>(
	command: string,
	args: InvokeArgs & { path: string; content?: Buffer },
): Promise<O> => {
	switch (command) {
		case "read_file":
			const readRes = await fetch(convertFileSrc(args.path, "gramax-fs-stream"));
			if (readRes.ok) return (await readRes.arrayBuffer()) as O;
			throw new IoError(await readRes.json(), `${command}, ${JSON.stringify(args, null, 4)}`);

		case "write_file":
			const writeRes = await fetch(convertFileSrc(args.path, "gramax-fs-stream"), {
				method: "POST",
				body: args.content,
			});

			if (writeRes.ok) return;
			throw new IoError(await writeRes.json(), `${command}, ${JSON.stringify(args, null, 4)}`);
	}
};

const callAsPlugin = async <O>(command: string, args: InvokeArgs): Promise<O> => {
	try {
		return await invoke(`plugin:plugin-gramax-fs|${command}`, args);
	} catch (err) {
		throw new IoError(
			typeof err === "string" ? JSON.parse(err) : err,
			`${command}, ${JSON.stringify(args, null, 4)}`,
		);
	}
};

export const call = async <O>(command: string, args: InvokeArgs): Promise<O> => {
	if (CUSTOM_PROTOCOL_COMMANDS.includes(command)) return callAsCustomProtocol(command, args as any);
	return callAsPlugin(command, args);
};
