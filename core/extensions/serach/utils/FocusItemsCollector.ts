import type Url from "@core-ui/ApiServices/Types/Url";
import type { SearchFragmentInfo } from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";
import type { LinkOpenSideEffectOptions, SearchItemRowId } from "@ext/serach/utils/SearchRowsModel";

export class FocusItemsCollector {
	private readonly _map = new Map<SearchItemRowId, { item: CollectableFocusItem; index: number }>();
	private readonly _items: CollectableFocusItem[] = [];

	first() {
		return this._items[0];
	}

	get(id: SearchItemRowId, delta?: number): CollectableFocusItem {
		const index = this.getIndex(id, delta);
		if (index === undefined) return undefined;

		return this._items[index];
	}

	getByIndex(index: number): CollectableFocusItem {
		if (index == null) return undefined;

		const newIndex = Math.min(Math.max(0, index), this._items.length - 1);
		return this._items[newIndex];
	}

	getIndex(id: SearchItemRowId, delta?: number): number | undefined {
		const mapItem = this._map.get(id);
		if (!mapItem) return undefined;

		if (!delta) return mapItem.index;

		const newIndex = Math.min(Math.max(0, mapItem.index + delta), this._items.length - 1);
		return newIndex;
	}

	addLinkItem(item: { id: SearchItemRowId; url: Url; openSideEffect: LinkOpenSideEffectOptions }) {
		this.addItem(createLinkFocusItem(item));
	}

	addItem(item: CollectableFocusItem) {
		this._map.set(item.id, { item, index: this._items.length });
		this._items.push(item);
	}
}

export function createLinkFocusItem(item: {
	id: SearchItemRowId;
	url: Url;
	openSideEffect: LinkOpenSideEffectOptions;
}): LinkFocusItem {
	return {
		type: "link",
		id: item.id,
		url: item.url,
		pathname: item.openSideEffect.params.pathname,
		fragmentInfo: item.openSideEffect.params.fragmentInfo,
	};
}

export interface FocusItemBase {
	id: SearchItemRowId;
}

export interface LinkFocusItem extends FocusItemBase {
	type: "link";
	url: Url;
	pathname: string;
	fragmentInfo?: SearchFragmentInfo;
}

export interface ExpanderFocusItem extends FocusItemBase {
	type: "expander";
	count: number;
	expand: () => void;
}

export interface TempFocusItem extends FocusItemBase {
	type: "temp";
	index: number;
}

export type FocusItem = LinkFocusItem | ExpanderFocusItem | TempFocusItem;

export type CollectableFocusItem = LinkFocusItem | ExpanderFocusItem;
