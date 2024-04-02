import IoError from "@core/FileProvider/DiskFileProvider/DFPIOError";
import { InvokeArgs, invoke } from "@tauri-apps/api/core";

export const call = async <O>(command: string, args: InvokeArgs): Promise<O> => {
	try {
		return await invoke(`plugin:gramaxfs|${command}`, args);
	} catch (err) {
		throw new IoError(
			typeof err === "string" ? JSON.parse(err) : err,
			`${command}, ${JSON.stringify(args, null, 4)}`,
		);
	}
};
