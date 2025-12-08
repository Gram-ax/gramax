import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";

export class SnippetPaginator extends NodePaginator<HTMLDivElement> {
	constructor(snippetElement: HTMLDivElement, parentPaginator: Paginator) {
		super(snippetElement, parentPaginator);
	}

	async paginateNode() {
		this.currentContainer = this.node.cloneNode(false) as HTMLDivElement;
		this.parentPaginator.currentContainer.appendChild(this.currentContainer);

		this.addDimension();
		await super.paginateSource(this.node);

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		this.cleanHeadingElementsIfNeed();
		throwIfAborted();

		if (this.currentContainer.childNodes.length) {
			this.currentContainer = this.node.cloneNode(false) as HTMLDivElement;
		} else this.currentContainer.remove();

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this.currentContainer);

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
