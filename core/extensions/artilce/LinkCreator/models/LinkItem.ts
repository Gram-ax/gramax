import { ItemType } from "../../../../logic/FileStructue/Item/Item";

interface LinkItem {
	title: string;
	type: ItemType;
	logicPath: string;
	relativePath: string;
	breadcrumb: string[];
}

export default LinkItem;
