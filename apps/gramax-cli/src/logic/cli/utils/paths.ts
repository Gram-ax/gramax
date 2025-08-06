import CliUserError from "../../CliUserError";
import { exists, stat } from "fs-extra";
import { dirname, extname } from "path";

export function setRootPath(path: string): void {
	process.env.ROOT_PATH = dirname(path);
}

export const getPathWithExtension = async (path: string, name: string) => {
	if (!extname(path)) {
		if ((await exists(path)) && (await stat(path)).isDirectory()) {
			path += `/${name}`;
		} else {
			path += `${extname(name)}`;
		}
	}
	return path;
};

export const checkExistsPath = async (path: string) => {
	if (!(await exists(path))) throw new CliUserError(`The specified path is invalid or does not exist: ${path}`);
};
