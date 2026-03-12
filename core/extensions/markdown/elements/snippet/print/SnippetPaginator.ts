import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";

export class SnippetPaginator extends NodePaginator<HTMLDivElement> {
	async paginateNode() {
		this.currentContainer = this.node.cloneNode(false) as HTMLDivElement;

		this.addDimension();
		await super.paginateSource(this.node);

		this.parentPaginator.currentContainer.appendChild(this.currentContainer);
		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		this.parentPaginator.currentContainer.appendChild(this.currentContainer);
		this.cleanHeadingElementsIfNeed();
		throwIfAborted();

		if (this.haveChildNodes()) {
			this.currentContainer = this.node.cloneNode(false) as HTMLDivElement;
		} else this.currentContainer.remove();

		this.parentPaginator.createPage();

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	addDimension() {
		const addDimension = { ...this.nodeDimension };
		addDimension.height = addDimension.paddingH;
		this.updateAccumulatedHeightDim(addDimension);
	}
}
