import resolveModule from "@app/resolveModule/backend";
import call from "@app/resolveModule/fscall";
import FileInfo from "@core/FileProvider/model/FileInfo";
import { Buffer } from "buffer";

export const readdir = (path: string) => call<string[]>("read_dir", { path });

export const readFile = async (path: string) => Buffer.from(await call("read_file", { path }));

export const unlink = (path: string) => {
	return call<void>("rmfile", { path });
};

export const writeFile = async (path: string, content: string | Buffer) => {
	return call<void>("write_file", { path, content });
};

export const stat = async (path: string, followLink = false) => {
	const res = await call<FileInfo>("getstat", { path, followLink });
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

export const moveToTrash = (path: string) => resolveModule("moveToTrash")(path);
