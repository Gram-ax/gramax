import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { ControlInfo, PaginationInfo } from "@ext/print/utils/pagination/types";
import { createPage } from "./pageElements";
import { HEIGHT_TOLERANCE_PX } from "@ext/print/const";
import assert from "assert";

interface StaticParams {
	paginationInfo: PaginationInfo;
	pages: HTMLElement;
	controlInfo: ControlInfo;
}

class PagePaginator extends Paginator {
	private _pageContainer: HTMLElement;

	constructor(node: HTMLElement, staticParams: StaticParams) {
		Paginator.paginationInfo = staticParams.paginationInfo;
		Paginator.printPageInfo.pages = staticParams.pages;
		Paginator.controlInfo = staticParams.controlInfo;
		super(node);
	}

	async paginateNode(startPage?: HTMLElement) {
		assert(startPage);

		this.currentContainer = document.createDocumentFragment() as any;
		this._pageContainer = startPage;
		Paginator.paginationInfo.accumulatedHeight = NodeDimensions.createInitial();

		await super.paginateSource(this.node, true);

		if (this.currentContainer.childNodes.length) this._pageContainer.appendChild(this.currentContainer);
	}

	createPage() {
		this.cleanHeadingElementsIfNeed();
		if (this.currentContainer.childNodes.length) this._pageContainer.appendChild(this.currentContainer);
		const newPage = createPage(Paginator.printPageInfo.pages);
		this.currentContainer = document.createDocumentFragment() as any;
		this._pageContainer = newPage;
		Paginator.paginationInfo.accumulatedHeight = NodeDimensions.createInitial();
		this.setHeadings();
		return this.currentContainer;
	}

	cleanHeadingElementsIfNeed() {
		const childNodes = this.currentContainer.childNodes;
		if (!childNodes || !this.headingElements.length) return;
		if (childNodes.length === this.headingElements.length) this.headingElements = [];
	}

	static setUsablePageWidth(page: HTMLElement) {
		const cs = getComputedStyle(page);
		const widthPadding = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);

		const usablePageWidth = page.clientWidth - widthPadding;
		Paginator.printPageInfo.usablePageWidth = usablePageWidth;
	}

	static setUsablePageHeight(page: HTMLElement) {
		const cs = getComputedStyle(page);
		const heightPadding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

		const usablePageHeight = page.clientHeight - heightPadding + HEIGHT_TOLERANCE_PX;
		Paginator.printPageInfo.usablePageHeight = usablePageHeight;
	}
}

export default PagePaginator;
