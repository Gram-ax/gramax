import Path from "@core/FileProvider/Path/Path";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";

const deleteAnyFolderRule = async (fp: FileProvider, entries: CatalogEntry[]) => {
	const items = await fp.getItems(Path.empty);
	const catalogNames = entries.map((e) => e.name);
	for (const item of items) {
		if (item.type == "dir" && !catalogNames.includes(item.name)) {
			await fp.delete(item.path);
		}
	}
};

export default deleteAnyFolderRule;
