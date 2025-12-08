import { NodeDimensionsData } from "@ext/print/utils/pagination/NodeDimensions";
import { throwIfAborted } from "./abort";
import { ControlInfo, PaginationInfo, PrintPageInfo } from "@ext/print/utils/pagination/types";

abstract class Paginator<T extends HTMLElement = HTMLElement> {
	static paginationInfo: PaginationInfo;
	static printPageInfo: PrintPageInfo = {};
	static controlInfo: ControlInfo;

	public currentContainer: HTMLElement;
	public headingElements: HTMLHeadingElement[] = [];

	private _marginBottom: number;

	constructor(protected node: T) {}

	protected async paginateSource(source: HTMLElement, withProgress = false): Promise<void> {
		while (source.firstElementChild) {
			throwIfAborted(Paginator.controlInfo.signal);
			const node = source.firstElementChild as HTMLElement;

			await this._handleNode(node);
			if (!(node instanceof HTMLHeadingElement)) this.headingElements = [];
			withProgress && Paginator.controlInfo.progress.increase();
		}
	}

	protected setHeadings() {
		this.headingElements.forEach((heading, i) => {
			if (this.tryFitElement(heading, i === 0)) return;
			this.createPage();
			this.tryFitElement(heading, true);
		});
		this.headingElements = [];
	}

	getUsableHeight() {
		return Paginator.printPageInfo.usablePageHeight;
	}

	public tryFitElement(node: HTMLElement, force = false): boolean {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const accumulatedHeight = Paginator.paginationInfo.accumulatedHeight;

		if (!force && !nodeDimension.canUpdateAccumulatedHeight(node, accumulatedHeight, this.getUsableHeight()))
			return false;

		this.currentContainer.appendChild(node);
		this.updateAccumulatedHeightNode(node);
		return true;
	}

	protected updateAccumulatedHeightNode(node: HTMLElement) {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const accumulatedHeight = Paginator.paginationInfo.accumulatedHeight;
		Paginator.paginationInfo.accumulatedHeight = nodeDimension.updateAccumulatedHeightNode(node, accumulatedHeight);
	}

	protected updateAccumulatedHeightDim(dimension: NodeDimensionsData) {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const accumulatedHeight = Paginator.paginationInfo.accumulatedHeight;

		this._marginBottom = dimension.marginBottom;
		Paginator.paginationInfo.accumulatedHeight = nodeDimension.updateAccumulatedHeightDim(
			dimension,
			accumulatedHeight,
		);
		Paginator.paginationInfo.accumulatedHeight.marginBottom = 0;
	}

	protected setMarginBottom() {
		Paginator.paginationInfo.accumulatedHeight.marginBottom = this._marginBottom;
	}

	protected get nodeDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const tablePadding = nodeDimension.get(this.node);
		return tablePadding;
	}

	abstract paginateNode(): void | Promise<void>;
	abstract createPage(): HTMLElement;
	protected abstract cleanHeadingElementsIfNeed(): void;

	private async _handleNode(node: HTMLElement) {
		const printHandlers = Paginator.paginationInfo.printHandlers;

		for (const handler of printHandlers.required) {
			if (await handler(node, this)) return;
		}

		const yieldTick = Paginator.controlInfo.yieldTick;
		const signal = Paginator.controlInfo.signal;

		if (this.tryFitElement(node)) return;

		for (const handler of printHandlers.conditional) {
			if (await handler(node, this)) return;
		}

		await yieldTick();
		throwIfAborted(signal);
		this.createPage();
		this.tryFitElement(node, true);
	}
}

export default Paginator;
