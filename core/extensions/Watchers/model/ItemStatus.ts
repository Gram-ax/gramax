import type { Item } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { FileStatus } from "./FileStatus";

export interface ItemStatus {
	item: Item;
	status: FileStatus;
}

export interface ItemRefStatus {
	ref: ItemRef;
	status: FileStatus;
}
