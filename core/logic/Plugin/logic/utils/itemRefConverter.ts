import Path from "@core/FileProvider/Path/Path";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";

const itemRefConverter = {
	toId: (itemRef: ItemRef): string => {
		return JSON.stringify({ path: itemRef.path.value, storageId: itemRef.storageId });
	},

	toItemRef: (id: string): ItemRef => {
		const itemRef: { path: string; storageId: string } = JSON.parse(id);
		return { path: new Path(itemRef.path), storageId: itemRef.storageId };
	},
};

export default itemRefConverter;
