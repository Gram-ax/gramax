import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import Path from "@core/FileProvider/Path/Path";
import { LinkItemSidebarProps } from "@ext/artilce/LinkCreator/components/LinkItemSidebar";
import { ReactElement } from "react";
import { ListItem } from "@components/List/Item";
import { filter } from "@components/List/ListLayout";

const linkFilter = (items: ListItem[], input: string) => {
	const filterItems = (input: string) => {
		if (!input) return items;
		const currentFilter = filter(input);

		const filteredItemsByTitle: ListItem[] = [];

		const filteredItemsByPath: ListItem[] = [];

		items?.map((item) => {
			if (currentFilter(item.labelField)) {
				filteredItemsByTitle.push(item);
				return;
			}

			const pathname = (item.element as ReactElement<LinkItemSidebarProps>).props.item?.pathname;
			if (!pathname) return null;

			const filePath = new Path(RouterPathProvider.parsePath(pathname).filePath).value;

			if (currentFilter(filePath)) {
				filteredItemsByPath.push(item);
			}
		});

		const filteredItems = filteredItemsByTitle?.concat(filteredItemsByPath);

		return filteredItems.length > 0 ? filteredItems : null;
	};
	return multiLayoutSearcher<ListItem[]>(filterItems, true)(input);
};

export default linkFilter;
