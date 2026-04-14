import { getConfig } from "@app/config/AppConfig";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import Path from "@core/FileProvider/Path/Path";

const getScopeSeparator = () => {
	if (getExecutingEnvironment() === "cli") return "~";
	if (getExecutingEnvironment() === "static" && !getConfig().services.cloud.url) return "~";
	return ":";
};

export const addScopeToPath = (path: string | string[] | Path, scope?: string, encode = true): string => {
	path = path instanceof Path ? path.value : path;
	path = typeof path === "string" ? path.split("/") : path;
	const idx = path[0] === "" ? 1 : 0;
	const scopeSeparator = getScopeSeparator();
	scope
		? (path[idx] =
				path[idx].split(scopeSeparator).at(0) + scopeSeparator + (encode ? encodeURIComponent(scope) : scope))
		: (path[idx] = path[idx].split(scopeSeparator).at(0));
	return path.join("/");
};
