import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CategoryLink, ItemLink } from "../../extensions/navigation/NavigationLinks";

const UiUrlUtils = {
	getArticleLinks(itemLinks: ItemLink[]): ItemLink[] {
		return itemLinks.flatMap((link) =>
			link.type == ItemType.article ? link : [link, ...UiUrlUtils.getArticleLinks((link as CategoryLink).items)],
		);
	},
};

export default UiUrlUtils;
