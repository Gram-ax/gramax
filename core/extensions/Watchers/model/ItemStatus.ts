import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { FileStatus } from "./FileStatus";

export interface ItemStatus {
	itemRef: ItemRef;
	type: FileStatus;
}
