import { ItemType } from "@core/FileStructue/Item/ItemType";
import { CategoryLink, ItemLink } from "../../extensions/navigation/NavigationLinks";

const UiUrlUtils = {
	getArticleLinks(itemLinks: ItemLink[]): ItemLink[] {
		return itemLinks
			.map((link) =>
				link.type == ItemType.article
					? link
					: [link, ...UiUrlUtils.getArticleLinks((link as CategoryLink).items)],
			)
			.flat();
	},
};

export default UiUrlUtils;
