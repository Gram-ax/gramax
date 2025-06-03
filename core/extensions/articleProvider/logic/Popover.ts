import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import PopoverLocalStorageManager from "@ext/articleProvider/logic/PopoverLocalStorageManager";
import TooltipBase from "@ext/markdown/elementsUtils/prosemirrorPlugins/TooltipBase";
import { FC } from "react";

export type PopoverPosition = { x: number; y: number };
export type PopoverSize = { width: number; height: number };
export type PopoverRect = PopoverPosition & PopoverSize;

class Popover<T> extends TooltipBase {
	isMounted = false;
	element: HTMLElement;
	item: T;
	providerType: ArticleProviderType;
	onDestroy: () => void;
	localStorageManager: PopoverLocalStorageManager;
	isPinned = false;
	id: string;

	constructor(
		id: string,
		component: FC,
		parentElement: HTMLElement,
		item: T,
		apiUrlCreator: ApiUrlCreator,
		localStorageManager: PopoverLocalStorageManager,
		items: T[],
		selectedIds: string[],
		providerType: ArticleProviderType,
	) {
		super(
			component,
			{
				item,
				apiUrlCreator,
				items,
				selectedIds,
				providerType,
			},
			parentElement,
		);

		this.id = id;
		this.item = item;
		this.localStorageManager = localStorageManager;
	}

	unMount() {
		this.closeComponent();
	}

	updateComponentProps<T extends object>(newProps: T) {
		this.updateProps(newProps);
	}

	canSetComponent() {
		return true;
	}

	updateRect(rect: PopoverRect) {
		this.localStorageManager.update(this.id, { rect });
		this.updateProps({ rect });
	}

	setIsPinned(isPinned: boolean) {
		if (isPinned === this.isPinned) return;
		this.isPinned = isPinned;

		this.updateProps({ isPinned });
	}

	setComponent(element: HTMLElement) {
		if (!element) return this.closeComponent();

		if (!this.isMounted) {
			this.setTooltipPosition(element);
		}

		if (!this.canSetComponent()) return;

		this.element = element;
		this.isMounted = true;
		const rect = this.getRect();
		const tooltipPosition = this.calculateTooltipPosition(element);

		this.updateProps({
			providerType: this.providerType,
			isOpen: true,
			element,
			tooltipPosition,
			rect,
			isPinned: this.isPinned,
			updateRect: (rect) => this.updateRect(rect),
			setIsPinned: (isPinned) => this.setIsPinned(isPinned),
		});
	}

	closeComponent() {
		this.isMounted = false;
		this.updateProps({ isOpen: false });
		this._element.remove();
	}

	getRect(): Partial<PopoverRect> {
		const rect = this.localStorageManager.getDataByID(this.id)?.rect;
		if (rect?.x && rect?.y) {
			this.isPinned = true;
		}

		return rect;
	}

	calculateTooltipPosition(element: HTMLElement): Partial<PopoverRect> {
		const distance = -7;
		const xOffset = -10;
		const domReact = this._parentElement.getBoundingClientRect();
		const rect = element.getBoundingClientRect();
		const leftOffset = rect.left - domReact.left;
		const top = rect.top - domReact.top + distance;

		return {
			x: leftOffset + rect.width + xOffset,
			y: top,
		};
	}

	override setTooltipPosition(element: HTMLElement) {
		const { x, y } = this.calculateTooltipPosition(element);

		this._element.style.left = x + "px";
		this._element.style.top = y + "px";
	}
}

export default Popover;
