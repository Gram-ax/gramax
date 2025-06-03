import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PromptNoteTooltipEditor from "@ext/ai/components/Tab/PromptNoteTooltipEditor";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { PopoverManager } from "@ext/articleProvider/logic/PopoverManager";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { PROMPT_LOCALSTORAGE_KEY } from "@ext/ai/models/consts";

export type PromptContextType = {
	items: ProviderItemProps[];
	selectedIds: string[];
};

export const PromptContext = createContext<PromptContextType>({
	items: [],
	selectedIds: [],
});

let _setItems: (items: ProviderItemProps[]) => void = () => {};
let _setSelectedIds: (ids: string[]) => void = () => {};

abstract class PromptService {
	private static _tooltipManager: PopoverManager<ProviderItemProps> = null;

	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const [items, setItems] = useState<ProviderItemProps[]>([]);
		const [selectedIds, setSelectedIds] = useState<string[]>([]);
		const tooltipManager = useRef<PopoverManager<ProviderItemProps>>(null);

		_setItems = setItems;
		_setSelectedIds = setSelectedIds;

		useEffect(() => {
			if (typeof document === "undefined") return;
			if (tooltipManager.current !== null) tooltipManager.current.destroyAll();

			tooltipManager.current = new PopoverManager(
				document.body,
				apiUrlCreator,
				items,
				selectedIds,
				PromptNoteTooltipEditor,
				PROMPT_LOCALSTORAGE_KEY,
				"prompt",
			);

			PromptService._tooltipManager = tooltipManager.current;

			return () => {
				if (tooltipManager.current !== null) {
					tooltipManager.current.destroyAll();
					tooltipManager.current = null;
				}
			};
		}, []);

		useEffect(() => {
			if (PromptService._tooltipManager) {
				PromptService._tooltipManager.updateProps({ items, selectedIds });
			}
		}, [items, selectedIds]);

		return PromptService.Context({ children, value: { items, selectedIds } });
	}

	static Context({ children, value }: { children: JSX.Element; value: PromptContextType }): JSX.Element {
		return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
	}

	static openNote(note: ProviderItemProps, element: HTMLElement) {
		if (typeof document === "undefined") return;
		const tooltipManager = this.getTooltipManager();
		const tooltip = tooltipManager.findTooltip(note.id);

		if (!tooltip) {
			tooltipManager.createTooltip(note.id, note, element);
		}
	}

	static closeNote(id: string) {
		if (typeof document === "undefined") return;
		const tooltipManager = this.getTooltipManager();
		const tooltip = tooltipManager.findTooltip(id);

		if (tooltip) {
			tooltipManager.removeTooltip(tooltip);

			return tooltip;
		}
	}

	static get value(): PromptContextType {
		return useContext(PromptContext);
	}

	static getTooltipManager(): PopoverManager<ProviderItemProps> {
		return this._tooltipManager;
	}

	static setItems(items: ProviderItemProps[]) {
		_setItems(items);
	}

	static async fetchList(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getArticleListInGramaxDir("prompt");
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const items = await res.json();

		this.setItems(items);
	}

	static removeAllItems() {
		_setItems([]);

		const tooltipManager = this.getTooltipManager();
		tooltipManager?.destroyAll();

		_setSelectedIds([]);
	}

	static setSelectedIds(ids: string[]) {
		_setSelectedIds(ids);
	}
}

export default PromptService;
