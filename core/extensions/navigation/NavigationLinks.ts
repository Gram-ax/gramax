import Style from "@components/HomePage/Cards/model/Style";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";

export interface CatalogLink extends BaseLink {
	name: string;
	logo: string;
	code: string;
	title: string;
	style: Style;
	group: string;
	order: number;
	description: string;
	lastVisited?: string;
	isCloning?: boolean;
	cloneCancelDisabled?: boolean;
	redirectOnClone?: string;
	isFavorite?: boolean;
}

export interface BaseLink {
	pathname: string;
	query?: { [name: string]: string };
	hash?: string;
}

export interface ItemLink extends BaseLink {
	type: ItemType;
	title: string;
	icon: string;
	isCurrentLink: boolean;
	ref: ClientItemRef;
	external?: string;
	status?: FileStatus;
}

export interface CategoryLink extends ItemLink {
	type: ItemType.category;
	items: (ItemLink | CategoryLink)[];
	isExpanded: boolean;
	filter?: LinkFilter;
	existContent?: boolean;
}

export interface ArticleLink extends ItemLink {
	type: ItemType.article;
	alwaysShow?: boolean;
}

export interface LinkFilter {
	top?: number;
	last?: number;
}

export interface TitledLink {
	url?: string;
	title?: string;
	icon?: string;
	target?: "_self" | "_blank" | "_parent" | "_top";
	private?: boolean;
	onClick?: () => void;
	childrens?: TitledLink[];
}
