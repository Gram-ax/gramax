import Path from "@core/FileProvider/Path/Path";

export const addGitTreeScopeToPath = (path: string | string[] | Path, scope?: string): string => {
	path = path instanceof Path ? path.value : path;
	path = typeof path === "string" ? path.split("/") : path;
	const idx = path[0] === "" ? 1 : 0;
	scope
		? (path[idx] = path[idx].split(":").at(0) + ":" + encodeURIComponent(scope))
		: (path[idx] = path[idx].split(":").at(0));
	return path.join("/");
};
