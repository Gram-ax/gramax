/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected*/
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { PopoverManager } from "@ext/articleProvider/logic/PopoverManager";
import InboxNoteTooltipEditor from "@ext/inbox/components/InboxNoteTooltipEditor";
import { INBOX_LOCALSTORAGE_KEY } from "@ext/inbox/models/consts";
import type { InboxArticle } from "@ext/inbox/models/types";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export type InboxContextType = {
	items: InboxArticle[];
	selectedIds: string[];
};

export const InboxContext = createContext<InboxContextType>({
	items: [],
	selectedIds: [],
});

let SetItems: (items: InboxArticle[]) => void = () => {};
let SetSelectedIds: (ids: string[]) => void = () => {};

abstract class InboxService {
	private static _tooltipManager: PopoverManager<InboxArticle> = null;

	static Provider = ({ children }: { children: JSX.Element }): JSX.Element => {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const [items, setItems] = useState<InboxArticle[]>([]);
		const [selectedIds, setSelectedIds] = useState<string[]>([]);
		const tooltipManager = useRef<PopoverManager<InboxArticle>>(null);

		SetItems = setItems;
		SetSelectedIds = setSelectedIds;

		// biome-ignore lint/correctness/useExhaustiveDependencies: expected
		useEffect(() => {
			if (typeof document === "undefined") return;
			if (tooltipManager.current !== null) tooltipManager.current.destroyAll();

			tooltipManager.current = new PopoverManager(
				document.body,
				apiUrlCreator,
				items,
				selectedIds,
				InboxNoteTooltipEditor,
				INBOX_LOCALSTORAGE_KEY,
				"inbox",
			);

			this._tooltipManager = tooltipManager.current;

			return () => {
				if (tooltipManager.current !== null) {
					tooltipManager.current.destroyAll();
					tooltipManager.current = null;
				}
			};
		}, []);

		useEffect(() => {
			if (this._tooltipManager) {
				this._tooltipManager.updateProps({ items, selectedIds });
			}
		}, [items, selectedIds]);

		return this.Context({ children, value: { items, selectedIds } });
	};

	static Context = ({ children, value }: { children: JSX.Element; value: InboxContextType }): JSX.Element => {
		return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
	};

	static openNote = (note: InboxArticle, element: HTMLElement) => {
		if (typeof document === "undefined") return;
		const tooltipManager = this.getTooltipManager();
		const tooltip = tooltipManager.findTooltip(note.id);

		if (!tooltip) {
			tooltipManager.createTooltip(note.id, note, element);
		}
	};

	static closeNote = (id: string) => {
		if (typeof document === "undefined") return;
		const tooltipManager = this.getTooltipManager();
		const tooltip = tooltipManager.findTooltip(id);

		if (tooltip) {
			tooltipManager.removeTooltip(tooltip);
		}
	};

	static get value(): InboxContextType {
		return useContext(InboxContext);
	}

	static getTooltipManager(): PopoverManager<InboxArticle> {
		return this._tooltipManager;
	}

	static setItems(items: InboxArticle[]) {
		SetItems(items);
	}

	static async fetchInbox(mail: string, apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getInboxArticles(mail);
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const items = await res.json();

		this.setItems(items);
	}

	static removeAllItems() {
		SetItems([]);

		const tooltipManager = this.getTooltipManager();
		tooltipManager?.destroyAll();

		SetSelectedIds([]);
	}

	static setSelectedIds(ids: string[]) {
		SetSelectedIds(ids);
	}
}

export default InboxService;
