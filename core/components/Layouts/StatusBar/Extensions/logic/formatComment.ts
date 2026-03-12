import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";

interface FormatCommentData {
	path: string;
	oldPath: string;
	resources: {
		path: string;
		oldPath: string;
	}[];
}

const formatPath = ({ path, oldPath }: { path?: string; oldPath?: string }) => {
	if (path && oldPath && path !== oldPath) return `${oldPath} -> ${path}`;
	return path ?? oldPath;
};

const formatComment = (data: DiffTree, selectedFilePaths: Set<string>) => {
	if (!data) return "";
	const newSelectedFilePaths = new Set(selectedFilePaths);
	const formatCommentData: FormatCommentData[] = [];

	const flatTree = data.data;

	flatTree.forEach((item, currentIndex) => {
		if (item.type === "node") return;
		if (!newSelectedFilePaths.has(item.filepath.new)) return;

		const resources: { path: string; oldPath: string }[] = [];

		for (let i = currentIndex + 1; i < flatTree.length; i++) {
			const next = flatTree[i];
			if (next.indent <= item.indent) break;
			if (next.type === "resource") {
				resources.push({
					path: next.filepath.new,
					oldPath: next.filepath.old,
				});
			}
		}

		formatCommentData.push({
			path: item.filepath.new,
			oldPath: item.filepath.old,
			resources,
		});

		newSelectedFilePaths.delete(item.filepath.new);
		if (item.filepath.old) newSelectedFilePaths.delete(item.filepath.old);

		resources.forEach((r) => {
			newSelectedFilePaths.delete(r.path);
			if (r.oldPath) newSelectedFilePaths.delete(r.oldPath);
		});
	});

	const paths: { path: string; prefix: string }[] = [];
	formatCommentData.forEach((d) => {
		paths.push({ path: formatPath({ path: d.path, oldPath: d.oldPath }), prefix: " - " });
		d.resources.forEach((r) => {
			paths.push({ path: formatPath({ path: r.path, oldPath: r.oldPath }), prefix: "   - " });
		});
	});

	if (paths.length === 1) return `Update file: ${paths[0].path}`;
	return `Update ${paths.length} files\n\n${paths.map((d) => `${d.prefix}${d.path}`).join("\n")}`;
};

export default formatComment;
