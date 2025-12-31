import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";

type ListElement = HTMLOListElement | HTMLUListElement;
export class ListPaginator extends NodePaginator<ListElement> {
	private _currentStartNumber = 1;
	private _listContainer: ListElement;
	private _taskItemTemplate?: HTMLElement;

	constructor(listElement: ListElement, parentPaginator: Paginator) {
		super(listElement, parentPaginator);
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const currentList = this.node.cloneNode(false) as ListElement;
		this.parentPaginator.currentContainer.appendChild(currentList);
		this._listContainer = currentList;

		this._currentStartNumber = 1;
		const listItems = Array.from(this.node.children) as HTMLElement[];

		this.addDimension();

		for (const li of listItems) {
			this._taskItemTemplate = null;

			this.currentContainer = this._listContainer;
			if (this.tryFitElement(li)) {
				this._currentStartNumber++;
				continue;
			}

			const currentNode = this.getContainer(li);
			this.currentContainer = currentNode.cloneNode(false) as HTMLElement;
			await super.paginateSource(currentNode);

			this.setIntoListContainer();
			this._currentStartNumber++;
		}

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		const isSplitedItem = this.currentContainer.childNodes.length;
		if (!this._listContainer.childNodes.length && !isSplitedItem) this._listContainer.remove();
		this.cleanHeadingElementsIfNeed();

		if (isSplitedItem) this.setIntoListContainer();

		const parentPage = this.parentPaginator.createPage();
		const currentList = this.node.cloneNode(false) as HTMLOListElement | HTMLUListElement;
		if (this.node.tagName === "OL") {
			currentList.style.setProperty("counter-reset", `listitem ${this._currentStartNumber}`);
			currentList.setAttribute("start", `${this._currentStartNumber}`);
		}
		parentPage.appendChild(currentList);
		this._listContainer = currentList;
		this.currentContainer = this.currentContainer.cloneNode(false) as HTMLLIElement;
		if (isSplitedItem) {
			this.currentContainer.style.setProperty("list-style", "none");
			(this._taskItemTemplate || this.currentContainer).classList.add("no-marker");
		}

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	addDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		if (!this._taskItemTemplate) {
			const addDimension = { ...this.nodeDimension };
			addDimension.height = addDimension.paddingH;
			return this.updateAccumulatedHeightDim(addDimension);
		}

		const taskItemDimension = nodeDimension.get(this.node.firstElementChild as HTMLElement);
		const addDimension = NodeDimensions.combineDimensions(this.nodeDimension, taskItemDimension);
		addDimension.height = addDimension.paddingH;
		return this.updateAccumulatedHeightDim(addDimension);
	}

	private setIntoListContainer() {
		if (!this._taskItemTemplate) return this._listContainer.appendChild(this.currentContainer);

		const container = this._taskItemTemplate.cloneNode(true) as HTMLElement;
		container.appendChild(this.currentContainer);
		this._listContainer.appendChild(container);
	}

	private getContainer(node: HTMLElement) {
		const isTaskItem = node.classList.contains("task-item");
		if (!isTaskItem) return node;
		this._taskItemTemplate = node.cloneNode(false) as HTMLElement;
		this._taskItemTemplate.appendChild(node.firstElementChild);
		return node.lastElementChild as HTMLElement;
	}
}
