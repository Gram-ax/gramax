import {
	CATEGORY_ROOT_FILENAME,
	NEW_ARTICLE_FILENAME,
	UNIQUE_NAME_SEPARATOR,
	UNIQUE_NAME_START_IDX,
} from "@app/config/const";
import Path from "../FileProvider/Path/Path";

const createNewFilePathUtils = {
	create(basePath: Path, brothers: Path[], baseFileName = NEW_ARTICLE_FILENAME, extension = ".md"): Path {
		let idx = UNIQUE_NAME_START_IDX;
		let path = basePath.parentDirectoryPath.join(new Path(baseFileName + extension));
		while (createNewFilePathUtils.pathIsExist(path, brothers)) {
			path = basePath.parentDirectoryPath.join(new Path(baseFileName + UNIQUE_NAME_SEPARATOR + idx + extension));
			idx++;
		}
		return path;
	},

	move(
		basePath: Path,
		oldPath: Path,
		isFolder: boolean,
		brothers?: Path[],
		folderFileName = CATEGORY_ROOT_FILENAME,
		extension = ".md",
	): Path {
		let path = basePath.parentDirectoryPath.join(
			new Path(
				isFolder
					? oldPath.parentDirectoryPath.nameWithExtension + `/${folderFileName}`
					: oldPath.nameWithExtension,
			),
		);

		if (brothers) {
			if (createNewFilePathUtils.pathIsExist(path, brothers))
				path = createNewFilePathUtils.create(basePath, brothers, path.name, extension);
			else path = null;
		}

		return (
			path ??
			basePath.parentDirectoryPath.join(
				isFolder
					? new Path(oldPath.parentDirectoryPath.nameWithExtension).join(new Path(oldPath.nameWithExtension))
					: new Path(oldPath.nameWithExtension),
			)
		);
	},

	pathIsExist(basePath: Path, paths: Path[]) {
		const index = paths.findIndex(
			(path) =>
				path.compare(basePath) || path.parentDirectoryPath.compare(new Path(basePath.stripDotsAndExtension)),
		);
		return index !== -1;
	},
};

export default createNewFilePathUtils;
