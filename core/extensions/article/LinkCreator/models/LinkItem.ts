import { ItemType } from "@core/FileStructue/Item/ItemType";

interface LinkItem {
	title: string;
	type: ItemType;
	pathname: string;
	relativePath: string;
	breadcrumb: string[];
	isCurrent?: boolean;
}

export default LinkItem;
