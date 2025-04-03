import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import InboxLocalStorageManager from "@ext/inbox/logic/InboxLocalStorageManager";
import InboxTooltip from "@ext/inbox/logic/InboxTooltip";
import { InboxArticle } from "@ext/inbox/models/types";

export class InboxTooltipManager {
	private _tooltips: Set<InboxTooltip> = new Set();
	private _localStorageManager: InboxLocalStorageManager;

	constructor(
		private parentElement: HTMLElement,
		private apiUrlCreator: ApiUrlCreator,
		private notes: InboxArticle[],
		private selectedPath: string[],
	) {
		this._localStorageManager = new InboxLocalStorageManager();
	}

	createTooltip(note: InboxArticle, element: HTMLElement) {
		const tooltip = new InboxTooltip(
			this.parentElement,
			note,
			this.apiUrlCreator,
			this._localStorageManager,
			this.notes,
			this.selectedPath,
		);

		tooltip.onDestroy = () => {
			this._tooltips.delete(tooltip);
		};

		tooltip.setComponent(element);

		this._tooltips.add(tooltip);
		return tooltip;
	}

	updateProps<T extends object>(newProps: T) {
		this._tooltips.forEach((tooltip) => {
			tooltip.updateComponentProps(newProps);
		});
	}

	getLocalStorageManager(): InboxLocalStorageManager {
		return this._localStorageManager;
	}

	removeTooltip(tooltip: InboxTooltip) {
		if (this._tooltips.has(tooltip)) {
			tooltip.unMount();
			this._tooltips.delete(tooltip);
		}
	}

	findTooltip(logicPath: string): InboxTooltip {
		return Array.from(this._tooltips).find((tooltip) => {
			return tooltip.note.logicPath === logicPath;
		});
	}

	getUnpinnedTooltips(): InboxTooltip[] {
		return Array.from(this._tooltips).filter((tooltip) => !tooltip.isPinned);
	}

	destroyAll() {
		this._tooltips.forEach((tooltip) => tooltip.unMount());
		this._tooltips.clear();
	}
}
