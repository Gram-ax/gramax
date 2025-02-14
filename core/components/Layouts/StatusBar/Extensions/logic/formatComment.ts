import { DiffTree, DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";

const formatPath = ({ path, oldPath }: { path?: string; oldPath?: string }) => {
	if (path && oldPath && path != oldPath) return `${oldPath} -> ${path}`;
	return path ?? oldPath;
};

const addSelectedPaths = (
	item: DiffTreeAnyItem,
	selectedFilePaths: Set<string>,
	result: { path: string; prefix: string }[],
): void => {
	if (item.type === "node") {
		item.childs.forEach((child) => addSelectedPaths(child, selectedFilePaths, result));
		return;
	}

	if (!selectedFilePaths.has(item.filepath.new)) return;
	result.push({ path: formatPath({ path: item.filepath.new, oldPath: item.filepath.old }), prefix: " - " });

	selectedFilePaths.delete(item.filepath.new);
	if (item.filepath.old) selectedFilePaths.delete(item.filepath.old);
	item.childs.forEach((child) => {
		if (child.type === "node") return;
		result.push({
			path: formatPath({ path: child.filepath.new, oldPath: child.filepath.old }),
			prefix: "   - ",
		});
		selectedFilePaths.delete(child.filepath.new);
		if (child.filepath.old) selectedFilePaths.delete(child.filepath.old);
	});
};

const formatComment = (data: DiffTree, selectedFilePaths: Set<string>) => {
	if (!data) return "";
	const paths: { path: string; prefix: string }[] = [];
	const newSelectedFilePaths = new Set(selectedFilePaths);
	data.tree.map((item) => addSelectedPaths(item, newSelectedFilePaths, paths));
	if (paths.length == 1) return `Update file: ${paths[0].path}`;
	return `Update ${paths.length} files\n\n${paths.map((d) => `${d.prefix}${d.path}`).join("\n")}`;
};

export default formatComment;
