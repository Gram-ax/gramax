import FileProvider from "@core/FileProvider/model/FileProvider";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import Path from "../../../FileProvider/Path/Path";

const deleteAnyFolderRule = async (fp: FileProvider, entries: CatalogEntry[]) => {
	const items = await fp.getItems(Path.empty);
	const catalogNames = entries.map((e) => e.getName());
	for (const item of items) {
		if (item.type == "dir" && !catalogNames.includes(item.name)) {
			await fp.delete(item.path);
		}
	}
};

export default deleteAnyFolderRule;
