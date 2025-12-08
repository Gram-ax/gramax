import { UNIQUE_NAME_SEPARATOR } from "@app/config/const";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { unique } from "@core/utils/uniqueName";

export type ArticleUniqueNamePair = {
	name: string;
	title: string;
	idx: number;
	exists: boolean;
};

export const resolveArticleUniqueNamePair = (targetRootCategory: Category, sourceItem: Item): ArticleUniqueNamePair => {
	const sourceItemName = sourceItem.getFileName();
	const sourceItemTitle = sourceItem.getTitle();

	const pair = { name: sourceItemName, title: sourceItemTitle };

	const maybeTargetItem = targetRootCategory.items.find((item) => {
		return item.getFileName() === sourceItemName || item.getTitle() === sourceItemTitle;
	});

	if (!maybeTargetItem) return { name: sourceItemName, title: sourceItemTitle, idx: 0, exists: false };

	const [newPair, idx] = unique(
		pair,
		(pair) =>
			targetRootCategory.items.some((item) => item.getFileName() === pair.name || item.getTitle() === pair.title),
		(pair, idx) => {
			return { name: `${pair.name}${UNIQUE_NAME_SEPARATOR}${idx}`, title: `${pair.title} ${idx}` };
		},
	);

	return { name: newPair.name, title: newPair.title, idx, exists: true };
};
