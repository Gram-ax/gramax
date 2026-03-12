import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useCallback, useMemo, useState } from "react";

export type UsePublishSelectedFilesProps = {
	diffTree: DiffTree;
};

export type UsePublishSelectedFiles = {
	selectedFiles: Set<string>;
	isSelectedAll: boolean;

	selectFile: (file: string, select: boolean, oldPath?: string) => void;
	selectAll: (select: boolean) => void;

	isSelected: (pathNew: string, pathOld?: string) => boolean;

	resetSelection: () => void;
};

const collectFilesFromTree = (diffTree: DiffTree, includeOldPathWhenAvailable = true): Map<string, string[]> => {
	if (!diffTree) return new Map();

	const paths = new Map<string, string[]>();
	const flatTree = diffTree.data;

	for (let i = 0; i < flatTree.length; i++) {
		const item = flatTree[i];

		if (item.type === "item") {
			paths.set(item.filepath.new, []);
			if (includeOldPathWhenAvailable && item.overview.status === FileStatus.rename) {
				paths.set(item.filepath.old, []);
			}

			for (let j = i + 1; j < flatTree.length; j++) {
				const next = flatTree[j];
				if (next.indent <= item.indent) break;

				if (next.type === "resource") {
					const resources = paths.get(item.filepath.new) || [];
					resources.push(next.filepath.new);
					paths.set(item.filepath.new, resources);

					if (includeOldPathWhenAvailable && next.overview.status === FileStatus.rename) {
						resources.push(next.filepath.old);
						paths.set(item.filepath.new, resources);
					}
				}
			}
		}

		if (item.type === "resource") {
			let hasParent = false;
			for (let k = i - 1; k >= 0; k--) {
				const prev = flatTree[k];
				if (prev.indent < item.indent) {
					if (prev.type === "item") hasParent = true;
					break;
				}
			}
			if (!hasParent) {
				paths.set(item.filepath.new, []);
				if (includeOldPathWhenAvailable && item.overview.status === FileStatus.rename) {
					paths.set(item.filepath.old, []);
				}
			}
		}
	}

	return paths;
};

const usePublishSelectedFiles = ({ diffTree }: UsePublishSelectedFilesProps): UsePublishSelectedFiles => {
	const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

	const [isSelectedAll, setIsSelectedAll] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const files = useMemo(() => {
		const files = collectFilesFromTree(diffTree);
		if (isSelectedAll || !selectedFiles?.length) setSelectedFiles(Array.from(files.keys()));
		return files;
	}, [diffTree]);

	const selectFile = useCallback(
		(path: string, select: boolean, oldPath?: string) => {
			if (!files.has(path)) return;

			if (select) {
				selectedFiles.push(path);
				if (oldPath && path !== oldPath) selectedFiles.push(oldPath);
			} else {
				selectedFiles.splice(selectedFiles.indexOf(path), 1);
				if (oldPath && path !== oldPath) selectedFiles.splice(selectedFiles.indexOf(oldPath), 1);
			}

			setIsSelectedAll(selectedFiles.length === files.size);
			setSelectedFiles([...selectedFiles]);
		},
		[selectedFiles, files],
	);

	const resetSelection = useCallback(() => {
		setSelectedFiles([]);
		setIsSelectedAll(true);
	}, []);

	const selectAll = useCallback(
		(select: boolean) => {
			setIsSelectedAll(select);
			setSelectedFiles(select ? Array.from(files.keys()) : []);
		},
		[files],
	);

	const isSelected = useCallback(
		(pathNew: string, pathOld?: string) => {
			if (isSelectedAll) return true;
			if (files.has(pathNew)) return selectedFiles.includes(pathNew);
			if (pathOld && pathNew !== pathOld && files.has(pathOld)) return selectedFiles.includes(pathOld);

			for (const [key, value] of files.entries()) {
				if (value.includes(pathNew)) return selectedFiles.includes(key);
				if (pathOld && pathNew !== pathOld && value.includes(pathOld)) return selectedFiles.includes(key);
			}

			return false;
		},
		[selectedFiles, files, isSelectedAll],
	);

	const selectedFilesWithResources = useMemo(
		() =>
			new Set([
				...selectedFiles,
				...[].concat(
					...Array.from(files.entries())
						.filter(([key]) => selectedFiles.includes(key))
						.map(([, value]) => value),
				),
			]),
		[selectedFiles, files],
	);

	return {
		selectedFiles: selectedFilesWithResources,
		isSelectedAll,
		selectFile,
		selectAll,
		isSelected,
		resetSelection,
	};
};

export default usePublishSelectedFiles;
