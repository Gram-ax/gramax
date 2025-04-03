import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { InboxTooltipManager } from "@ext/inbox/logic/InboxTooltipsManager";
import { InboxArticle } from "@ext/inbox/models/types";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export type InboxContextType = {
	notes: InboxArticle[];
	selectedPath: string[];
};

export const InboxContext = createContext<InboxContextType>({
	notes: [],
	selectedPath: [],
});

let _setNotes: (notes: InboxArticle[]) => void = () => {};
let _setSelectedPath: (path: string[]) => void = () => {};

abstract class InboxService {
	private static _tooltipManager: InboxTooltipManager = null;

	static Provider = ({ children }: { children: JSX.Element }): JSX.Element => {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const [notes, setNotes] = useState<InboxArticle[]>([]);
		const [selectedPath, setSelectedPath] = useState<string[]>([]);
		const tooltipManager = useRef<InboxTooltipManager>(null);

		_setNotes = setNotes;
		_setSelectedPath = setSelectedPath;

		useEffect(() => {
			if (typeof document === "undefined") return;
			if (tooltipManager.current !== null) tooltipManager.current.destroyAll();

			tooltipManager.current = new InboxTooltipManager(document.body, apiUrlCreator, notes, selectedPath);
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
				this._tooltipManager.updateProps({ notes, selectedPath });
			}
		}, [notes, selectedPath]);

		return this.Context({ children, value: { notes, selectedPath } });
	};

	static Context = ({ children, value }: { children: JSX.Element; value: InboxContextType }): JSX.Element => {
		return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
	};

	static openNote = (note: InboxArticle, element: HTMLElement) => {
		if (typeof document === "undefined") return;
		const tooltipManager = this.getTooltipManager();
		const tooltip = tooltipManager.findTooltip(note.logicPath);

		if (!tooltip) tooltipManager.createTooltip(note, element);
	};

	static closeNote = (logicPath: string) => {
		if (typeof document === "undefined") return;
		const tooltipManager = this.getTooltipManager();
		const tooltip = tooltipManager.findTooltip(logicPath);

		if (tooltip) {
			tooltipManager.removeTooltip(tooltip);
		}
	};

	static get value(): InboxContextType {
		return useContext(InboxContext);
	}

	static getTooltipManager(): InboxTooltipManager {
		return this._tooltipManager;
	}

	static setNotes(notes: InboxArticle[]) {
		_setNotes(notes);
	}

	static async fetchInbox(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getInboxArticles();
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const notes = await res.json();

		this.setNotes(notes);
	}

	static removeAllNotes() {
		_setNotes([]);

		const tooltipManager = this.getTooltipManager();
		tooltipManager?.destroyAll();

		_setSelectedPath([]);
	}

	static setSelectedPath(paths: string[]) {
		_setSelectedPath(paths);
	}
}

export default InboxService;
