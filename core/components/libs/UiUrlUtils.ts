import { CategoryLink, ItemLink } from "../../extensions/navigation/NavigationLinks";
import { ItemType } from "../../logic/FileStructue/Item/Item";

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
