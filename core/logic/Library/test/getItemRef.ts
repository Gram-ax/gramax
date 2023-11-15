import Path from "../../FileProvider/Path/Path";
import { Catalog } from "../../FileStructue/Catalog/Catalog";
import { ItemRef } from "../../FileStructue/Item/Item";

function getItemRef(catalog: Catalog, path: string): ItemRef {
	return {
		storageId: catalog.getRootCategory().ref.storageId,
		path: catalog.getRootCategoryPath().join(new Path(path)),
	};
}

export default getItemRef;
