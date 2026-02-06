import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

export class TabsPaginator extends NodePaginator<HTMLDivElement> {
	private _currentTab: HTMLDivElement;
	private _currentTabContainer: HTMLDivElement;
	private _tabsContainer: HTMLDivElement;
	private _tabsWrapper: HTMLDivElement;

	constructor(tabsElement: HTMLDivElement, parentPaginator: Paginator) {
		super(tabsElement, parentPaginator);
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const allTabElements = this.node.querySelectorAll<HTMLDivElement>(":scope > .tabs > .tab");
		this.addDimension();
		this._tabsWrapper = this.node.cloneNode(false) as HTMLDivElement;
		this._tabsContainer = this.node.firstElementChild.cloneNode(false) as HTMLDivElement;
		this._tabsWrapper.appendChild(this._tabsContainer);
		this.parentPaginator.currentContainer.appendChild(this._tabsWrapper);

		for (const tab of allTabElements) {
			const tabHeight = Paginator.paginationInfo.nodeDimension.get(tab).height;

			if (tabHeight + Paginator.paginationInfo.accumulatedHeight.height > this.getUsableHeight()) {
				this._currentTab = tab;
				this._currentTabContainer = tab.cloneNode(true) as HTMLDivElement;
				const contentContainer = this._currentTabContainer.querySelector<HTMLDivElement>(".content");
				this.currentContainer = contentContainer.cloneNode(false) as HTMLDivElement;
				const content = tab.querySelector<HTMLDivElement>(".content");

				if (!this._parentHasOnlyHeading()) this.createPage();
				else {
					this._tabsContainer.appendChild(this._currentTabContainer);
					this.addDimension();
					this.addTabDimension();
				}

				const nodeDimension = Paginator.paginationInfo.nodeDimension;

				const canAppend = nodeDimension.canUpdateAccumulatedHeight(
					content,
					Paginator.paginationInfo.accumulatedHeight,
					this.getUsableHeight(),
				);
				if (!canAppend) {
					contentContainer.replaceWith(this.currentContainer);
					await super.paginateSource(content);
				} else {
					Paginator.paginationInfo.accumulatedHeight = nodeDimension.updateAccumulatedHeightNode(
						content,
						Paginator.paginationInfo.accumulatedHeight,
					);
				}
				continue;
			}
			Paginator.paginationInfo.accumulatedHeight.height += tabHeight;

			this._tabsContainer.appendChild(tab);
		}

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		const tabsContainsSomeTab = !!this._tabsContainer.childNodes.length;
		if (!tabsContainsSomeTab) this._tabsWrapper.remove();

		this.cleanHeadingElementsIfNeed();
		throwIfAborted();

		if (tabsContainsSomeTab && this.currentContainer.childNodes.length) {
			this._currentTabContainer = this._currentTab.cloneNode(false) as HTMLDivElement;
			this.currentContainer = this.currentContainer.cloneNode(false) as HTMLDivElement;

			this._currentTabContainer.appendChild(this.currentContainer);
		}

		this._tabsContainer = this.node.firstElementChild.cloneNode(false) as HTMLDivElement;
		this._tabsContainer.appendChild(this._currentTabContainer);
		this._tabsWrapper = this.node.cloneNode(false) as HTMLDivElement;
		this._tabsWrapper.appendChild(this._tabsContainer);

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this._tabsWrapper);

		this.addDimension();
		this.addTabDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	getTabDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const tabDim = nodeDimension.get(this._currentTab);
		const contentDim = nodeDimension.get(this._currentTab.querySelector<HTMLDivElement>(".content"));
		const addTabDimension = { ...tabDim };

		addTabDimension.height -= contentDim.height + contentDim.paddingH;

		const addTabsDimension = { ...this.nodeDimension };
		addTabsDimension.height = addTabsDimension.paddingH;
		return { addTabDimension, addTabsDimension };
	}

	addTabDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const tabDim = nodeDimension.get(this._currentTab);
		const contentDim = nodeDimension.get(this._currentTab.querySelector<HTMLDivElement>(".content"));
		const addDimension = { ...tabDim };

		addDimension.height -= contentDim.height + contentDim.paddingH;
		this.updateAccumulatedHeightDim(addDimension);
	}

	addDimension() {
		const addDimension = { ...this.nodeDimension };
		addDimension.height = addDimension.paddingH;
		this.updateAccumulatedHeightDim(addDimension);
	}

	private _parentHasOnlyHeading() {
		const { headingElements, currentContainer } = this.parentPaginator;
		return headingElements.length && headingElements.length === currentContainer.childNodes.length - 1;
	}
}
