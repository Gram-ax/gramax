import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import Path from "../../../logic/FileProvider/Path/Path";
import type { ReadonlyCatalog } from "../../../logic/FileStructue/Catalog/ReadonlyCatalog";

function getItemRef(catalog: ReadonlyCatalog, path: string): ItemRef {
	return {
		storageId: catalog.getRootCategory().ref.storageId,
		path: catalog.getRootCategoryPath().join(new Path(path)),
	};
}

export default getItemRef;
