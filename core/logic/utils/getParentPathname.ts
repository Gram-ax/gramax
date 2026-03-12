import type Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";

const getParentPathname = async (catalog: Catalog | ContextualCatalog, path: Path) => {
	const item = catalog.findItemByItemPath(path);
	return await catalog.getPathname(item.parent);
};

export default getParentPathname;
