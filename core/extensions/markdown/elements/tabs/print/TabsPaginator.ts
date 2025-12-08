import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";

export class TabsPaginator extends NodePaginator<HTMLDivElement> {
	private currentTab: HTMLDivElement;
	private currentTabContainer: HTMLDivElement;
	private tabsContainer: HTMLDivElement;

	constructor(tabsElement: HTMLDivElement, parentPaginator: Paginator) {
		super(tabsElement, parentPaginator);
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const allTabElements = this.node.querySelectorAll<HTMLDivElement>(":scope > .tabs > .tab");
		this.addDimension();
		this.tabsContainer = this.node.cloneNode(false) as HTMLDivElement;
		this.parentPaginator.currentContainer.appendChild(this.tabsContainer);

		for (const tab of allTabElements) {
			const tabHeight = Paginator.paginationInfo.nodeDimension.get(tab).height;

			if (tabHeight + Paginator.paginationInfo.accumulatedHeight.height > this.getUsableHeight()) {
				this.currentTab = tab;
				this.currentTabContainer = tab.cloneNode(true) as HTMLDivElement;
				const content = tab.querySelector<HTMLDivElement>(".content");
				const contentContainer = this.currentTabContainer.querySelector<HTMLDivElement>(".content");
				this.currentContainer = contentContainer.cloneNode(false) as HTMLDivElement;

				this.tabsContainer.appendChild(this.currentTabContainer);
				contentContainer.replaceWith(this.currentContainer);

				this.addTabDimension();
				await super.paginateSource(content);
				continue;
			}
			Paginator.paginationInfo.accumulatedHeight.height += tabHeight;

			this.tabsContainer.appendChild(tab);
		}

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		this.cleanHeadingElementsIfNeed();
		throwIfAborted();

		const tabsContainsSomeTab = this.tabsContainer.childNodes.length > 1;
		if (this.currentContainer.childNodes.length || tabsContainsSomeTab) {
			if (!this.currentContainer.childNodes.length) this.currentTabContainer.remove();

			this.tabsContainer = this.node.cloneNode(false) as HTMLDivElement;
			this.currentTabContainer = this.currentTab.cloneNode(true) as HTMLDivElement;
			const contentContainer = this.currentTabContainer.querySelector<HTMLDivElement>(".content");
			this.currentContainer = contentContainer.cloneNode(false) as HTMLDivElement;

			this.tabsContainer.appendChild(this.currentTabContainer);
			contentContainer.replaceWith(this.currentContainer);
		} else this.tabsContainer.remove();

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this.tabsContainer);

		this.addDimension();
		this.addTabDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	addTabDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const tabDim = nodeDimension.get(this.currentTab);
		const contentDim = nodeDimension.get(this.currentTab.querySelector<HTMLDivElement>(".content"));
		const addDimension = { ...tabDim };

		addDimension.height -= contentDim.height + contentDim.paddingH;
		this.updateAccumulatedHeightDim(addDimension);
	}

	addDimension() {
		const addDimension = { ...this.nodeDimension };
		addDimension.height = addDimension.paddingH;
		this.updateAccumulatedHeightDim(addDimension);
	}
}
