import {
	createItemLinksStore,
	type ItemLinksStore,
	shouldReplaceItemLinks,
} from "@core-ui/stores/ItemLinksStore/ItemLinksStore";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

type ItemLinksStoreApi = ReturnType<typeof createItemLinksStore>;

const ItemLinksStoreContext = createContext<ItemLinksStoreApi | undefined>(undefined);

interface ItemLinksStoreProviderProps {
	children: ReactNode;
	itemLinks: ItemLink[];
}

export const ItemLinksStoreProvider = ({ children, itemLinks }: ItemLinksStoreProviderProps) => {
	const storeRef = useRef<ItemLinksStoreApi>(null);

	if (storeRef.current === null) {
		storeRef.current = createItemLinksStore({ itemLinks });
	}

	useEffect(() => {
		const store = storeRef.current;
		if (store && shouldReplaceItemLinks(itemLinks, store.getState().itemLinks)) store.setState({ itemLinks });
	}, [itemLinks]);

	if (storeRef.current === null) return null;
	return <ItemLinksStoreContext.Provider value={storeRef.current}>{children}</ItemLinksStoreContext.Provider>;
};

export const useItemLinksStore = <T,>(
	selector: (store: ItemLinksStore) => T,
	equalityFn?: ((a: T, b: T) => boolean) | "shallow",
): T => {
	const ctx = useContext(ItemLinksStoreContext);
	if (!ctx) return selector({ itemLinks: [], setItemLinks: () => undefined, patchItemProps: () => undefined });

	const actualEqualityFn = equalityFn === "shallow" ? shallow : equalityFn;
	return useStoreWithEqualityFn(ctx, selector, actualEqualityFn);
};

export const useItemLinks = (): ItemLink[] => useItemLinksStore((s) => s.itemLinks);
