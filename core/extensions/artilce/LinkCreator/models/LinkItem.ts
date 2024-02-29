import { ItemType } from "../../../../logic/FileStructue/Item/Item";

interface LinkItem {
	title: string;
	type: ItemType;
	pathname: string;
	relativePath: string;
	breadcrumb: string[];
}

export default LinkItem;
