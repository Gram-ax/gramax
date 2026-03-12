import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";

const findDiffItemByPath = (diffTree: DiffFlattenTreeAnyItem[], filePath: string): DiffFlattenTreeAnyItem => {
	for (const item of diffTree) {
		if (item.type === "item" || item.type === "resource") {
			if (item.filepath.new === filePath) {
				return item;
			}
		}
	}

	return null;
};

export default findDiffItemByPath;
