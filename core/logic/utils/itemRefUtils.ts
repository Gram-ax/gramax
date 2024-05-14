import { NEW_ARTICLE_FILENAME } from "@app/config/const";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import Path from "../FileProvider/Path/Path";
import { ClientItemRef } from "../SitePresenter/SitePresenter";
import createNewFilePathUtils from "./createNewFilePathUtils";

const itemRefUtils = {
	resolve(ref: ItemRef, path: Path): ItemRef {
		return {
			path: ref.path.join(path),
			storageId: ref.storageId,
		};
	},

	parseRef(ref: ClientItemRef): ItemRef {
		return {
			path: new Path(ref.path),
			storageId: ref.storageId,
		};
	},

	move(baseRef: ItemRef, ref: ItemRef, type: ItemType, itemRefs: ItemRef[] = []): ItemRef {
		return {
			path: createNewFilePathUtils.move(
				baseRef.path,
				ref.path,
				type == ItemType.category,
				itemRefs.map((i) => i.path),
				".md",
			),
			storageId: baseRef.storageId,
		};
	},

	create(baseRef: ItemRef, itemRefs: ItemRef[], baseFileName = NEW_ARTICLE_FILENAME): ItemRef {
		return {
			path: createNewFilePathUtils.create(
				baseRef.path,
				itemRefs.map((i) => i.path),
				baseFileName,
			),
			storageId: baseRef.storageId,
		};
	},
};

export default itemRefUtils;
