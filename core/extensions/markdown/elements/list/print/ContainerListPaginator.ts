import { ListPaginator } from "@ext/markdown/elements/list/print/ListPaginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

class ContainerListPaginator extends NodePaginator<HTMLDivElement> {
	private _container: HTMLDivElement;
	private _path: HTMLElement[] = [];
	private _listPaginator?: ListPaginator;

	constructor(containerElement: HTMLDivElement, parentPaginator: Paginator) {
		super(containerElement, parentPaginator);
		this._container = this.node.cloneNode(false) as HTMLDivElement;
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const path: HTMLElement[] = [];
		let cursor: HTMLElement | null = this.node as HTMLElement;
		let list: HTMLUListElement | HTMLOListElement | null = null;

		while (cursor?.firstElementChild) {
			const child = cursor.firstElementChild as HTMLElement;
			if (child.tagName === "UL" || child.tagName === "OL") {
				list = child as HTMLUListElement | HTMLOListElement;
				break;
			}
			path.push(child);
			cursor = child;
		}

		this._path = path;
		this.currentContainer = this._createChainFromPath(this._path, this._container);

		this.parentPaginator.currentContainer.appendChild(this._container);
		if (!list) {
			this.node.remove();
			return;
		}

		this._listPaginator = new ListPaginator(list, this);
		await this._listPaginator.paginateNode();

		await Paginator.controlInfo.yieldTick();
		throwIfAborted(Paginator.controlInfo.signal);

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		if (this.haveChildNodes()) {
			this._container = this._container.cloneNode(false) as HTMLDivElement;
			this.currentContainer = this._createChainFromPath(this._path, this._container);
		} else this._container.remove();

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this._container);

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	addDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const containerList = this.node.querySelector<HTMLElement>("div:has(> ul), div:has(> ol)");

		const containerListDim = nodeDimension.get(containerList);
		const addDimension = NodeDimensions.combineDimensions(this.nodeDimension, containerListDim);
		addDimension.height -= containerListDim.height + containerListDim.paddingH;
		return this.updateAccumulatedHeightDim(addDimension);
	}

	private _createChainFromPath(path: HTMLElement[], destRoot: HTMLElement) {
		let parent: HTMLElement = destRoot;
		for (const orig of path) {
			const clone = orig.cloneNode(false) as HTMLElement;
			parent.appendChild(clone);
			parent = clone;
		}
		return parent;
	}
}

export default ContainerListPaginator;
