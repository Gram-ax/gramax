import { ItemRef } from "../../../logic/FileStructue/Item/Item";
import { FileStatus } from "./FileStatus";

export interface ItemStatus {
	itemRef: ItemRef;
	type: FileStatus;
}
