import { DiffTree, DiffTreeAnyItem, DiffTreeItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";

interface FormatCommentData {
	path: string;
	oldPath: string;
	resources: {
		path: string;
		oldPath: string;
	}[];
}

const formatPath = ({ path, oldPath }: { path?: string; oldPath?: string }) => {
	if (path && oldPath && path != oldPath) return `${oldPath} -> ${path}`;
	return path ?? oldPath;
};

const addSelectedPaths = (
	item: DiffTreeAnyItem,
	selectedFilePaths: Set<string>,
	result: FormatCommentData[] = [],
): void => {
	if (item.type === "node") {
		item.childs.forEach((child) => addSelectedPaths(child, selectedFilePaths, result));
		return;
	}

	if (selectedFilePaths.has(item.filepath.new)) {
		const resources = item.childs.filter((c) => c.type === "resource") as DiffTreeItem[];
		result.push({
			path: item.filepath.new,
			oldPath: item.filepath.old,
			resources: resources.map((c: DiffTreeItem) => ({
				path: c.filepath.new,
				oldPath: c.filepath.old,
			})),
		});

		selectedFilePaths.delete(item.filepath.new);
		if (item.filepath.old) selectedFilePaths.delete(item.filepath.old);

		resources.forEach((c) => {
			selectedFilePaths.delete(c.filepath.new);
			if (c.filepath.old) selectedFilePaths.delete(c.filepath.old);
		});
	}

	item.childs.forEach((child) => addSelectedPaths(child, selectedFilePaths, result));
};

const formatComment = (data: DiffTree, selectedFilePaths: Set<string>) => {
	if (!data) return "";
	const formatCommentData: FormatCommentData[] = [];
	const newSelectedFilePaths = new Set(selectedFilePaths);
	data.tree.map((item) => addSelectedPaths(item, newSelectedFilePaths, formatCommentData));

	const paths: { path: string; prefix: string }[] = [];
	formatCommentData.forEach((d) => {
		paths.push({ path: formatPath({ path: d.path, oldPath: d.oldPath }), prefix: " - " });
		d.resources.forEach((r) => {
			paths.push({ path: formatPath({ path: r.path, oldPath: r.oldPath }), prefix: "   - " });
		});
	});

	if (paths.length == 1) return `Update file: ${paths[0].path}`;
	return `Update ${paths.length} files\n\n${paths.map((d) => `${d.prefix}${d.path}`).join("\n")}`;
};

export default formatComment;
