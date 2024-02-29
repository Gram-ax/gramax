import FileInfo from "@core/FileProvider/model/FileInfo";
import { invoke, InvokeArgs } from "@tauri-apps/api/core";
import { Buffer } from "buffer";
import TauriIoError from "./TauriIoError";

const call = async <O>(command: string, args: InvokeArgs): Promise<O> => {
	try {
		const res = await invoke(`plugin:gramaxfs|${command}`, args);
		return res as O;
	} catch (err) {
		throw new TauriIoError(
			typeof err === "string" ? JSON.parse(err) : err,
			`In command: ${command}, ${JSON.stringify(args, null, 4)}`,
		);
	}
};

export const readdir = (path: string) => call<string[]>("read_dir", { path });

export const readFile = async (path: string) => Buffer.from(await call("read_file", { path }));

export const unlink = (path: string) => call<void>("unlink", { path });

export const writeFile = async (path: string, content: string | Buffer) => {
	const buffer = typeof content == "string" ? Buffer.from(content) : content;
	return call<void>("write_file", { path, content: Array.from(buffer) });
};

export const stat = async (path: string, followLink = false) => {
	const res = await call<FileInfo>("stat", { path, followLink });
	res.isDirectory = () => res.type == "dir";
	res.isFile = () => res.type == "file";
	res.isSymbolicLink = () => false;

	return res;
};

export const lstat = (path: string) => stat(path, true);

export const mkdir = (path: string, opts?: { recursive?: boolean; mode?: any }) =>
	call<void>("make_dir", { path, recursive: opts?.recursive ?? false });

export const rmdir = (path: string, opts?: { recursive?: boolean }) =>
	call<void>("remove_dir", { path, recursive: opts?.recursive ?? false });

export const readlink = (path: string) => call<string>("read_link", { path });

export const rename = (from: string, to: string) => call<void>("rename", { from, to });

export const symlink = (from: string, to: string) => call<void>("make_symlink", { from, to });

export const exists = (path: string) => call<boolean>("exists", { path });

export const copy = (from: string, to: string) => call<void>("copy", { from, to });

export const move = (from: string, to: string) => call<void>("mv", { from, to });

export const rm = async (path: string, opts?: { recursive?: boolean; force?: boolean }) => {
	try {
		const stats = await stat(path);
		await (stats.isFile() ? unlink(path) : rmdir(path, opts));
	} catch (err) {
		if (!opts?.force) throw err;
	}
};
