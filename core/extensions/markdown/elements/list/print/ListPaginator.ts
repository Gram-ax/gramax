import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";

export class ListPaginator extends NodePaginator<HTMLOListElement | HTMLUListElement> {
	private currentStartNumber = 1;
	private listContainer: HTMLElement;
	private taskItemTemplate?: HTMLElement;

	constructor(listElement: HTMLOListElement | HTMLUListElement, parentPaginator: Paginator) {
		super(listElement, parentPaginator);
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const currentList = this.node.cloneNode(false) as HTMLOListElement | HTMLUListElement;
		this.parentPaginator.currentContainer.appendChild(currentList);
		this.listContainer = currentList;

		this.currentStartNumber = 1;
		const listItems = Array.from(this.node.children) as HTMLElement[];

		this.addDimension();

		for (const li of listItems) {
			this.taskItemTemplate = null;

			this.currentContainer = this.listContainer;
			if (this.tryFitElement(li)) {
				this.currentStartNumber++;
				continue;
			}

			const currentNode = this.getContainer(li);
			this.currentContainer = currentNode.cloneNode(false) as HTMLElement;
			await super.paginateSource(currentNode);

			this.setIntoListContainer();
			this.currentStartNumber++;
		}

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		this.cleanHeadingElementsIfNeed();
		const isSplitedItem = this.currentContainer.childNodes.length;
		if (isSplitedItem) this.setIntoListContainer();

		const parentPage = this.parentPaginator.createPage();
		const currentList = this.node.cloneNode(false) as HTMLOListElement | HTMLUListElement;
		if (this.node.tagName === "OL") {
			currentList.style.setProperty("counter-reset", `listitem ${this.currentStartNumber}`);
			currentList.setAttribute("start", `${this.currentStartNumber}`);
		}
		parentPage.appendChild(currentList);
		this.listContainer = currentList;
		this.currentContainer = this.currentContainer.cloneNode(false) as HTMLLIElement;
		if (isSplitedItem) {
			this.currentContainer.style.setProperty("list-style", "none");
			(this.taskItemTemplate || this.currentContainer).classList.add("no-marker");
		}

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	addDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		if (!this.taskItemTemplate) {
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
		if (!this.taskItemTemplate) return this.listContainer.appendChild(this.currentContainer);

		const container = this.taskItemTemplate.cloneNode(true) as HTMLElement;
		container.appendChild(this.currentContainer);
		this.listContainer.appendChild(container);
	}

	private getContainer(node: HTMLElement) {
		const isTaskItem = node.classList.contains("task-item");
		if (!isTaskItem) return node;
		this.taskItemTemplate = node.cloneNode(false) as HTMLElement;
		this.taskItemTemplate.appendChild(node.firstElementChild);
		return node.lastElementChild as HTMLElement;
	}
}
