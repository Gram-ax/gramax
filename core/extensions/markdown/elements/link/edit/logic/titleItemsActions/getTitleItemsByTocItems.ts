import { TitleItem } from "@core-ui/ContextServices/LinkTitleTooltip";
import { TocItem } from "@ext/navigation/article/logic/createTocItems";

const getTitleItemsByTocItems = (items: TocItem[]): TitleItem[] => {
	if (!items.length) return [];
	return items.map((tocItem) => {
		const items = tocItem.items?.length > 0 ? getTitleItemsByTocItems(tocItem.items) : [];
		return {
			title: tocItem.title,
			url: tocItem.url,
			items: items,
			level: 0,
		};
	});
};

const flatTitleItems = (items: TitleItem[], level: number, flatItems: TitleItem[]) => {
	items.forEach((item) => {
		flatItems.push({ title: item.title, level, url: item.url });
		if (item.items?.length > 0) {
			flatTitleItems(item.items, level + 1, flatItems);
		}
	});
};

export { getTitleItemsByTocItems, flatTitleItems };
