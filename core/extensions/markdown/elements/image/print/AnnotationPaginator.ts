import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

class AnnotationPaginator extends NodePaginator<HTMLDivElement> {
	private _container: HTMLDivElement;
	private _olContainer: HTMLElement;

	async paginateNode() {
		this._olContainer = this.node.firstElementChild as HTMLElement;
		this._createAnnotationWrapper();

		this.parentPaginator.currentContainer.appendChild(this._container);
		this.paginateSource(this._olContainer);

		await Paginator.controlInfo.yieldTick();
		throwIfAborted(Paginator.controlInfo.signal);

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		if (this.haveChildNodes()) {
			this._createAnnotationWrapper();
		} else this._container.remove();

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this._container);

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	addDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const olContainer = this.node.firstElementChild as HTMLOListElement;

		const containerListDim = nodeDimension.get(olContainer);
		const addDimension = NodeDimensions.combineDimensions(this.nodeDimension, containerListDim);
		addDimension.height = addDimension.height - containerListDim.height + containerListDim.paddingH;
		return this.updateAccumulatedHeightDim(addDimension);
	}

	private _createAnnotationWrapper() {
		this._container = this.node.cloneNode(false) as HTMLDivElement;
		this.currentContainer = this._olContainer.cloneNode(false) as HTMLElement;
		this._container.appendChild(this.currentContainer);
	}
}

export default AnnotationPaginator;
