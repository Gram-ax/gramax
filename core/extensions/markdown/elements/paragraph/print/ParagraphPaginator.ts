import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { NodeDimensionsData } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import someParentHaveChildNodes from "@ext/print/utils/pagination/utils/someParentHaveChildNodes";

/**
 * Pagination for paragraphs taller than the page height.
 *
 * Supports paragraphs with nested elements (tags like `<a>`, `<strong>`, `<em>`, etc.),
 * using Range to measure fragment heights.
 */
export class ParagraphPaginator {
	private _nodeDimension: NodeDimensionsData;

	constructor(
		private node: HTMLParagraphElement,
		private parentPaginator: Paginator,
	) {
		this._nodeDimension = Paginator.paginationInfo.nodeDimension.get(this.node);
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const dims = nodeDimension.get(this.node);

		if (!dims) {
			this.parentPaginator.tryFitElement(this.node, true);
			return;
		}

		const fullText = this.node.textContent ?? "";
		if (!fullText.trim().length) {
			this.parentPaginator.tryFitElement(this.node, true);
			return;
		}

		const totalCharCount = this._getTotalCharCount(this.node);

		const baseParagraph = this.node.cloneNode(false) as HTMLParagraphElement;

		let startCharIndex = 0;
		let currentPart = 0;

		while (startCharIndex < totalCharCount) {
			throwIfAborted(Paginator.controlInfo.signal);

			if (currentPart) this.parentPaginator.createPage();

			const { endCharIndex, height: segmentHeight } = this._findEndCharIndexForPage(
				this.node,
				startCharIndex,
				totalCharCount,
			);

			if (!currentPart && !this._checkCanUpdate(segmentHeight) && this._isSomeParentHaveChildNodes()) {
				this.parentPaginator.createPage();
				const tryFit = this.parentPaginator.tryFitElement(this.node);
				if (tryFit) return;
			}
			currentPart++;

			const segment = baseParagraph.cloneNode(false) as HTMLParagraphElement;
			this._setParagraphContent(segment, startCharIndex, endCharIndex);

			const pageContainer = this.parentPaginator.currentContainer;
			pageContainer.appendChild(segment);

			const acc = Paginator.paginationInfo.accumulatedHeight;
			const usableHeight = this.parentPaginator.getUsableHeight();
			acc.height = Math.min(acc.height + segmentHeight, usableHeight);
			acc.marginBottom = dims.marginBottom;
			Paginator.paginationInfo.accumulatedHeight = acc;

			startCharIndex = endCharIndex;

			if (currentPart % 2 === 0) {
				await Paginator.controlInfo.yieldTick();
				throwIfAborted(Paginator.controlInfo.signal);
			}
		}

		this.node.remove();
	}

	private _isSomeParentHaveChildNodes() {
		return (
			this.parentPaginator.haveChildNodes() ||
			(this.parentPaginator instanceof NodePaginator && someParentHaveChildNodes(this.parentPaginator))
		);
	}

	private _checkCanUpdate(height: number) {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const dims = this._nodeDimension;
		const newDims = { ...dims, height };
		const canUpdate = nodeDimension.canUpdateAccumulatedHeightDim(newDims, this.parentPaginator.getUsableHeight());
		return canUpdate;
	}

	private _getTotalCharCount(element: HTMLElement): number {
		let count = 0;
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		let node: Node | null = walker.nextNode();
		while (node) {
			count += (node as Text).data.length;
			node = walker.nextNode();
		}
		return count;
	}

	/**
	 * Copies a portion of content from sourceElement to targetElement,
	 * from charIndexStart to charIndexEnd (inclusive), preserving element structure.
	 * Uses Range.cloneContents() for accurate DOM cloning.
	 */
	private _setParagraphContent(targetElement: HTMLElement, charIndexStart: number, charIndexEnd: number): void {
		const sourceElement = this.node.cloneNode(true) as HTMLElement;
		const range = document.createRange();
		this._setRangeToCharIndex(range, sourceElement, charIndexStart, charIndexEnd);
		const clonedContent = range.cloneContents();
		targetElement.appendChild(clonedContent);
	}

	/**
	 * Finds the maximum possible endCharIndex for the current page
	 * so that the Range from charIndexStart to endCharIndex does not exceed the page height.
	 */
	private _findEndCharIndexForPage(
		element: HTMLElement,
		charIndexStart: number,
		totalCharCount: number,
	): { endCharIndex: number; height: number } {
		const usableHeight = this.parentPaginator.getUsableHeight();
		const accumulated = Paginator.paginationInfo.accumulatedHeight;

		const dim = this._nodeDimension;
		const collapsedMargin = Math.max(accumulated.marginBottom, dim.marginTop);
		const pageHeightLeft = Math.max(0, usableHeight - accumulated.height - collapsedMargin - dim.marginBottom);

		const range = document.createRange();

		let low = charIndexStart + 1;
		let high = totalCharCount;
		let bestIndex = charIndexStart;
		let bestHeight = 0;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			this._setRangeToCharIndex(range, element, charIndexStart, mid);

			const rect = range.getBoundingClientRect();
			const h = rect.height || 0;

			if (!h) {
				low = mid + 1;
				continue;
			}

			if (h <= pageHeightLeft) {
				bestIndex = mid;
				bestHeight = h;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		// If nothing fits (even one character), take the entire remainder
		// to avoid creating empty pages — let there be one "broken" page
		if (bestHeight === 0) {
			const fallbackEnd = totalCharCount;
			this._setRangeToCharIndex(range, element, charIndexStart, fallbackEnd);
			const rect = range.getBoundingClientRect();
			const h = rect.height || 0;
			return { endCharIndex: fallbackEnd, height: h };
		}

		return { endCharIndex: bestIndex, height: bestHeight };
	}

	private _setRangeToCharIndex(
		range: Range,
		element: HTMLElement,
		charIndexStart: number,
		charIndexEnd: number,
	): void {
		let currentIndex = 0;
		let startNode: Text | null = null;
		let startOffset = 0;
		let endNode: Text | null = null;
		let endOffset = 0;

		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		let node: Node | null = walker.nextNode();

		while (node) {
			const textNode = node as Text;
			const textLength = textNode.data.length;

			if (!startNode && currentIndex + textLength > charIndexStart) {
				startNode = textNode;
				startOffset = charIndexStart - currentIndex;
			}

			if (currentIndex + textLength >= charIndexEnd) {
				endNode = textNode;
				endOffset = charIndexEnd - currentIndex;
				break;
			}

			currentIndex += textLength;
			node = walker.nextNode();
		}

		if (startNode && endNode) {
			range.setStart(startNode, startOffset);
			range.setEnd(endNode, endOffset);
		}
	}
}

export default ParagraphPaginator;
