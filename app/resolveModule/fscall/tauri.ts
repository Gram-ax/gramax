import { isTauriMobile } from "@app/resolveModule/env";
import IoError from "@core/FileProvider/DiskFileProvider/DFPIOError";
import { InvokeArgs, convertFileSrc, invoke } from "@tauri-apps/api/core";

const CUSTOM_PROTOCOL_COMMANDS = isTauriMobile() ? ["read_file"] : ["read_file", "write_file"];

const callAsCustomProtocol = async <O>(
	command: string,
	args: InvokeArgs & { path: string; content?: Buffer },
): Promise<O> => {
	switch (command) {
		case "read_file":
			const readRes = await fetch(convertFileSrc(args.path, "gramax-fs-stream"));
			if (readRes.ok) return (await readRes.arrayBuffer()) as O;

			const readerr = await readRes.json();
			throw new IoError({
				name: "IO (gramax-fs-stream / read_file)",
				code: readerr.name,
				message: `${readerr.name}: ${readerr.message};\nargs: ${JSON.stringify(args, null, 4)}`,
			});

		case "write_file":
			const writeRes = await fetch(convertFileSrc(args.path, "gramax-fs-stream"), {
				method: "POST",
				body: args.content,
			});

			if (writeRes.ok) return;
			const writeerr = await writeRes.json();
			throw new IoError({
				name: "IO (gramax-fs-stream / write_file)",
				code: writeerr.name,
				message: `${writeerr.name}: ${writeerr.message};\nargs: ${JSON.stringify(args, null, 4)}`,
			});
	}
};

const callAsPlugin = async <O>(command: string, args: InvokeArgs): Promise<O> => {
	try {
		return await invoke(`plugin:plugin-gramax-fs|${command}`, args);
	} catch (err) {
		throw new IoError({
			name: `IO (${command})`,
			code: err.name,
			message: `${err.name}: ${err.message};\nargs: ${JSON.stringify(args, null, 4)}`,
		});
	}
};

export const call = async <O>(command: string, args: InvokeArgs): Promise<O> => {
	if (CUSTOM_PROTOCOL_COMMANDS.includes(command)) return await callAsCustomProtocol(command, args as any);
	return await callAsPlugin(command, args);
};
