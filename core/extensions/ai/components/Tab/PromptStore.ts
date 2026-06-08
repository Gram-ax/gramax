import type PageDataContext from "@core/Context/PageDataContext";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { PROMPT_LOCALSTORAGE_KEY } from "@ext/ai/models/consts";
import { PopoverManager } from "@ext/articleProvider/logic/PopoverManager";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import type { FC } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { createStore } from "zustand/vanilla";

type PromptState = {
	items: ProviderItemProps[];
	selectedIds: string[];
	pageDataContext: PageDataContext | null;
	catalogProps: ClientCatalogProps | null;
	tooltipManager: PopoverManager<ProviderItemProps> | null;
};

type PromptActions = {
	setItems: (items: ProviderItemProps[]) => void;
	setSelectedIds: (ids: string[]) => void;
	setContext: (pageDataContext: PageDataContext, catalogProps: ClientCatalogProps) => void;
	removeAllItems: () => void;
	openNote: (note: ProviderItemProps, element: HTMLElement) => void;
	closeNote: (id: string) => HTMLElement | undefined;
	initTooltipManager: (apiUrlCreator: ApiUrlCreator, component: FC) => void;
	destroyTooltipManager: () => void;
	fetchList: (apiUrlCreator: ApiUrlCreator) => Promise<void>;
};

export type PromptStoreType = PromptState & PromptActions;

export const promptStore = createStore<PromptStoreType>()((set, get) => ({
	items: [],
	selectedIds: [],
	pageDataContext: null,
	catalogProps: null,
	tooltipManager: null,

	setItems: (items) => {
		const { tooltipManager, selectedIds } = get();
		set({ items });
		tooltipManager?.updateProps({ items, selectedIds });
	},

	setSelectedIds: (selectedIds) => {
		const { tooltipManager, items } = get();
		set({ selectedIds });
		tooltipManager?.updateProps({ items, selectedIds });
	},

	setContext: (pageDataContext, catalogProps) => set({ pageDataContext, catalogProps }),

	removeAllItems: () => {
		get().tooltipManager?.destroyAll();
		set({ items: [], selectedIds: [] });
	},

	openNote: (note, element) => {
		if (typeof document === "undefined") return;
		const { tooltipManager } = get();
		if (!tooltipManager?.findTooltip(note.id)) {
			tooltipManager?.createTooltip(note.id, note, element);
		}
	},

	closeNote: (id) => {
		if (typeof document === "undefined") return;
		const { tooltipManager } = get();
		const tooltip = tooltipManager?.findTooltip(id);
		if (!tooltip) return;
		tooltipManager.removeTooltip(tooltip);
		return tooltip.element;
	},

	initTooltipManager: (apiUrlCreator, component) => {
		if (typeof document === "undefined") return;
		const { items, selectedIds, tooltipManager } = get();
		tooltipManager?.destroyAll();
		const manager = new PopoverManager(
			document.body,
			apiUrlCreator,
			items,
			selectedIds,
			component,
			PROMPT_LOCALSTORAGE_KEY,
			"prompt",
		);
		set({ tooltipManager: manager });
	},

	destroyTooltipManager: () => {
		get().tooltipManager?.destroyAll();
		set({ tooltipManager: null });
	},

	fetchList: (apiUrlCreator) => {
		const url = apiUrlCreator.getArticleListInGramaxDir("prompt");
		return FetchService.fetch(url).then((res) => {
			if (res.ok) {
				res.json().then((items: ProviderItemProps[]) => get().setItems(items));
			}
		});
	},
}));

export const usePromptStore = <T>(
	selector: (state: PromptStoreType) => T,
	equalityFn?: ((a: T, b: T) => boolean) | "shallow",
): T => {
	const actualEqualityFn = equalityFn === "shallow" ? shallow : equalityFn;
	return useStoreWithEqualityFn(promptStore, selector, actualEqualityFn);
};
