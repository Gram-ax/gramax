import type { NodeModel } from "@minoru/react-dnd-treeview";
import type { CategoryLink, ItemLink } from "../../../NavigationLinks";

const getOpenItemsIds = (items: NodeModel<ItemLink>[]): (number | string)[] => {
	const ids: (number | string)[] = [];
	items?.forEach((item) => {
		if (item.parent == 0 || (item.data as CategoryLink).isExpanded) ids.push(item.id);
	});
	return ids;
};

export default getOpenItemsIds;
