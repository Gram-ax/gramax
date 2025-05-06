import { DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";

const findDiffItemByPath = (diffTree: DiffTreeAnyItem[], filePath: string): DiffTreeAnyItem => {
	for (const item of diffTree) {
		if (item.type === "item" || item.type === "resource") {
			if (item.filepath.new === filePath) {
				return item;
			}
			const child = findDiffItemByPath(item.childs, filePath);
			if (child) return child;
		}
		if (item.type === "node") {
			const child = findDiffItemByPath(item.childs, filePath);
			if (child) return child;
		}
	}

	return null;
};

export default findDiffItemByPath;
