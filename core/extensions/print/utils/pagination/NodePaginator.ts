import Paginator from "@ext/print/utils/pagination/Paginator";

abstract class NodePaginator<T extends HTMLElement = HTMLElement> extends Paginator<T> {
	constructor(node: T, public parentPaginator: Paginator) {
		super(node);
	}

	cleanHeadingElementsIfNeed() {
		if (this.currentContainer.childNodes.length !== this.headingElements.length) return;
		let parent = this.parentPaginator;
		while (parent) {
			if (!parent.currentContainer.childNodes) return (this.headingElements = []);
			parent = (parent as NodePaginator).parentPaginator;
		}
		this.headingElements.forEach((heading) => heading.remove());
	}
}

export default NodePaginator;
