import { ItemProps } from "@core/FileStructue/Item/Item";
import { PopoverRect } from "@ext/articleProvider/logic/Popover";
import { ProviderItemProps } from "@ext/articleProvider/models/types";

export type InboxDragItemData = { draggedId: string };
export type InboxDropItemData = { droppedId: string };
export type InboxDragDropData = InboxDragItemData & InboxDropItemData;

export type Author = string;

export type InboxProps = ItemProps & {
	date?: string;
	author?: Author;
	fileName?: string;
	welcome?: boolean;
};

export type InboxArticle = ProviderItemProps & {
	props: {
		date: string;
		author: Author;
	};
};

export type InboxArticleId = string;

export type InboxLocalStorageData = {
	[key: InboxArticleId]: InboxArticleLocalStorageData;
};

export type InboxArticleLocalStorageData = {
	rect: PopoverRect;
};
