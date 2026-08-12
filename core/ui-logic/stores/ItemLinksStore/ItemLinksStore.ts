import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { createStore } from "zustand/vanilla";

export type ItemLinksStore = {
	itemLinks: ItemLink[];
	setItemLinks: (links: ItemLink[]) => void;
	patchItemProps: (patches: { path: string; props: Partial<ItemLink> }[]) => void;
};

const defaultInitState: { itemLinks: ItemLink[] } = { itemLinks: [] };

export const shouldReplaceItemLinks = (next: ItemLink[], current: ItemLink[]): boolean =>
	next.length > 0 || current.length === 0;

export const createItemLinksStore = (initState = defaultInitState) => {
	return createStore<ItemLinksStore>()((set) => ({
		...initState,
		setItemLinks: (links: ItemLink[]) => set({ itemLinks: links }),
		patchItemProps: (patches: { path: string; props: Partial<ItemLink> }[]) =>
			set((state) => {
				if (!patches.length || !state.itemLinks?.length) return state;
				const patchMap = new Map(patches.map((p) => [p.path, p.props]));

				const patchLinks = (links: ItemLink[]): ItemLink[] => {
					let hasChanges = false;
					const newArr = links.map((link) => {
						const patch = patchMap.get(link.ref.path);
						const items =
							"items" in link && Array.isArray(link.items) ? (link.items as ItemLink[]) : undefined;
						const newItems = items ? patchLinks(items) : undefined;

						if (!patch && newItems === items) return link;

						hasChanges = true;
						const newLink = { ...link, ...patch };
						if (items) (newLink as { items?: ItemLink[] }).items = newItems;

						return newLink;
					});
					return hasChanges ? newArr : links;
				};

				const newLinks = patchLinks(state.itemLinks);
				return newLinks === state.itemLinks ? state : { itemLinks: newLinks };
			}),
	}));
};
