import type Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";

const getParentPathname = async (catalog: Catalog | ContextualCatalog, path: Path) => {
	try {
		const item = catalog.findItemByItemPath(path);
		return await catalog.getPathname(item.parent);
	} catch {
		return null;
	}
};

export default getParentPathname;
