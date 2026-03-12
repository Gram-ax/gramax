import Paginator from "@ext/print/utils/pagination/Paginator";

abstract class NodePaginator<
	Node extends HTMLElement = HTMLElement,
	CurrentContainer extends HTMLElement = HTMLElement,
> extends Paginator<Node, CurrentContainer> {
	constructor(
		node: Node,
		public parentPaginator: Paginator,
	) {
		super(node);
	}

	cleanHeadingElementsIfNeed() {
		if (!this.lastChildNodeIsHeading()) {
			this.headingElements = [];
			return;
		}
		if (!this.hasOnlyHeadingElements()) return;
		let parent = this.parentPaginator;
		while (parent) {
			if (!parent.currentContainer.childNodes) {
				this.headingElements = [];
				return;
			}
			parent = (parent as NodePaginator).parentPaginator;
		}
		this.headingElements.forEach((heading) => heading.remove());
	}
}

export default NodePaginator;
