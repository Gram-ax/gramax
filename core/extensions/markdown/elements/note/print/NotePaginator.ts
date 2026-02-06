import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

export class NotePaginator extends NodePaginator<HTMLDivElement> {
	private admonitionContainer: HTMLDivElement;
	private admonitionContentContainer: HTMLDivElement;
	private originalHeading: HTMLDivElement;

	constructor(noteElement: HTMLDivElement, parentPaginator: Paginator) {
		super(noteElement, parentPaginator);
		this.admonitionContainer = this.node.cloneNode(false) as HTMLDivElement;
	}

	async paginateNode() {
		this.originalHeading = this.node.querySelector<HTMLDivElement>(".admonition-heading");
		const headingClone = this.originalHeading.cloneNode(true) as HTMLElement;
		this.admonitionContainer.appendChild(headingClone);

		this.parentPaginator.currentContainer.appendChild(this.admonitionContainer);

		const admonitionContentContainer = this.node.querySelector<HTMLDivElement>(".admonition-content");
		this.admonitionContentContainer = admonitionContentContainer.cloneNode(false) as HTMLDivElement;

		const admonitionContent = admonitionContentContainer.firstElementChild as HTMLDivElement;
		this.currentContainer = admonitionContent.cloneNode(false) as HTMLDivElement;

		this.admonitionContentContainer.appendChild(this.currentContainer);
		this.admonitionContainer.appendChild(this.admonitionContentContainer);

		this.addDimension();
		await super.paginateSource(admonitionContent);

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		this.cleanHeadingElementsIfNeed();
		throwIfAborted();

		if (this.currentContainer.childNodes.length) {
			this.admonitionContainer = this.admonitionContainer.cloneNode(false) as HTMLDivElement;
			this.admonitionContentContainer = this.admonitionContentContainer.cloneNode(false) as HTMLDivElement;
			this.currentContainer = this.currentContainer.cloneNode(false) as HTMLDivElement;

			this.admonitionContentContainer.appendChild(this.currentContainer);
			this.admonitionContainer.appendChild(this.admonitionContentContainer);
		} else this.admonitionContainer.remove();

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this.admonitionContainer);

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	getAdmonitionContentContainer() {
		return this.node.querySelector<HTMLDivElement>(".admonition-content");
	}

	addDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;

		const admonitionContentContainerDim = nodeDimension.get(this.getAdmonitionContentContainer());
		if (!this.admonitionContainer.querySelector<HTMLDivElement>(".admonition-heading")) {
			const addDimension = NodeDimensions.combineDimensions(this.nodeDimension, admonitionContentContainerDim);
			addDimension.height = addDimension.paddingH;
			return this.updateAccumulatedHeightDim(addDimension);
		}

		const addDimension = { ...this.nodeDimension };
		addDimension.height -= admonitionContentContainerDim.height + admonitionContentContainerDim.paddingH;
		return this.updateAccumulatedHeightDim(addDimension);
	}
}
