import Path from "../../../../../logic/FileProvider/Path/Path";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import { ItemRef } from "../../../../../logic/FileStructue/Item/Item";

const convertToSharePointDir = (catalog: Catalog, articleRef: ItemRef, path: string): Path => {
	if (!path) return Path.empty;
	const sharePointDirectory = catalog?.getProp("sharePointDirectory") ?? catalog?.getName() ?? "";

	const sharePointPathParts =
		catalog
			?.getRootCategoryPath()
			.subDirectory(articleRef.path)
			?.parentDirectoryPath?.value?.split("/")
			.filter((p) => p) ?? [];

	sharePointPathParts?.unshift(sharePointDirectory);

	return new Path(sharePointPathParts).join(new Path(path));
};

export default convertToSharePointDir;
