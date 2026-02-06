import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import Popover from "@ext/articleProvider/logic/Popover";
import PopoverLocalStorageManager from "@ext/articleProvider/logic/PopoverLocalStorageManager";
import { FC } from "react";

export class PopoverManager<T> {
	private _tooltips: Set<Popover<T>> = new Set();
	private _localStorageManager: PopoverLocalStorageManager;

	constructor(
		private parentElement: HTMLElement,
		private apiUrlCreator: ApiUrlCreator,
		private notes: T[],
		private selectedPath: string[],
		private _component: FC,
		private _key: string,
		private providerType: ArticleProviderType,
	) {
		this._localStorageManager = new PopoverLocalStorageManager(this._key);
	}

	createTooltip(id: string, note: T, element: HTMLElement) {
		const tooltip = new Popover<T>(
			id,
			this._component,
			this.parentElement,
			note,
			this.apiUrlCreator,
			this._localStorageManager,
			this.notes,
			this.selectedPath,
			this.providerType,
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

	getLocalStorageManager(): PopoverLocalStorageManager {
		return this._localStorageManager;
	}

	removeTooltip(tooltip: Popover<T>) {
		if (this._tooltips.has(tooltip)) {
			tooltip.unMount();
			this._tooltips.delete(tooltip);
		}
	}

	findTooltip(id: string): Popover<T> {
		return Array.from(this._tooltips).find((tooltip) => {
			return tooltip.id === id;
		});
	}

	getUnpinnedTooltips(): Popover<T>[] {
		return Array.from(this._tooltips).filter((tooltip) => !tooltip.isPinned);
	}

	destroyAll() {
		this._tooltips.forEach((tooltip) => tooltip.unMount());
		this._tooltips.clear();
	}
}
