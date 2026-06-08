import type { NodeModel } from "@minoru/react-dnd-treeview";
import type { CategoryLink, ItemLink } from "../../../NavigationLinks";

const getOpenItemsIds = (items: NodeModel<ItemLink>[]): (number | string)[] => {
	const ids: (number | string)[] = [];
	items?.forEach((item) => {
		const isExpanded = (item.data as CategoryLink)?.isExpanded;
		if (isExpanded === true) ids.push(item.id);
		else if (item.parent === 0 && isExpanded !== false) ids.push(item.id);
	});
	return ids;
};

export default getOpenItemsIds;
