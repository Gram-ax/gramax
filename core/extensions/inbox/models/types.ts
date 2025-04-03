import { ItemProps } from "@core/FileStructue/Item/Item";
import { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import { JSONContent } from "@tiptap/core";

export type InboxDragItemData = { draggedLogicPath: string };
export type InboxDropItemData = { droppedLogicPath: string };
export type InboxDragDropData = InboxDragItemData & InboxDropItemData;

export type Author = string;

export type InboxProps = ItemProps & {
	date?: string;
	author?: Author;
	fileName?: string;
	welcome?: boolean;
};

export type InboxArticle = {
	title: string;
	logicPath: string;
	pathname: string;
	ref: ClientItemRef;
	content: JSONContent;
	fileName: string;
	props: {
		date: string;
		author: Author;
	};
};

export type InboxPosition = { x: number; y: number };
export type InboxSize = { width: number; height: number };
export type InboxRect = InboxPosition & InboxSize;

export type InboxArticleId = string;

export type InboxLocalStorageData = {
	[key: InboxArticleId]: InboxArticleLocalStorageData;
};

export type InboxArticleLocalStorageData = {
	rect: InboxRect;
};
