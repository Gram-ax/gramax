import { CATEGORY_ROOT_FILENAME } from "@core/FileStructue/FileStructure";
import Path from "../FileProvider/Path/Path";

const createNewFilePathUtils = {
	create(basePath: Path, brothers: Path[], baseFileName = "new_article_", extension = ".md"): Path {
		let idx = 0;
		let path: Path;
		let pathIsExist = false;
		do {
			path = basePath.parentDirectoryPath.join(new Path(baseFileName + idx + extension));
			pathIsExist = createNewFilePathUtils.pathIsExist(path, brothers);
			idx++;
		} while (pathIsExist);
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
			new Path(isFolder ? oldPath.parentDirectoryPath.name + `/${folderFileName}` : oldPath.nameWithExtension),
		);

		if (brothers) {
			if (createNewFilePathUtils.pathIsExist(path, brothers))
				path = createNewFilePathUtils.create(basePath, brothers, path.name + "_", extension);
			else path = null;
		}

		return (
			path ??
			basePath.parentDirectoryPath.join(
				isFolder
					? new Path(oldPath.parentDirectoryPath.name).join(new Path(oldPath.nameWithExtension))
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
