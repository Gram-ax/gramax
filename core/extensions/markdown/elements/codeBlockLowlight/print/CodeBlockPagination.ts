import ParagraphPaginator from "@ext/markdown/elements/paragraph/print/ParagraphPaginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions, type NodeDimensionsData } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import assert from "assert";

class CodeBlockPaginator extends NodePaginator<HTMLPreElement> {
	private _currentPre: HTMLPreElement;
	private _srcWrapper: HTMLElement;
	private _wrapperDimension: NodeDimensionsData;

	constructor(srcPre: HTMLPreElement, parentPaginator: Paginator) {
		super(srcPre, parentPaginator);
		this._srcWrapper = this.node.querySelector(".child-wrapper") as HTMLElement;
		assert(this._srcWrapper, "CodeBlock without .child-wrapper");
		this._wrapperDimension = this._getWrapperDimension();
	}

	async paginateNode() {
		const codeLines = Array.from(this._srcWrapper.querySelectorAll(".code-line"));

		this._createPreWrapper();
		this.parentPaginator.currentContainer.appendChild(this._currentPre);

		this.addDimension();

		for (let index = 0; index < codeLines.length; index++) {
			if (index) this.currentContainer.appendChild(document.createTextNode("\n"));
			const lineElement = codeLines[index];
			throwIfAborted(Paginator.controlInfo.signal);

			const lineDimension = Paginator.paginationInfo.nodeDimension.get(lineElement as HTMLElement);
			const height =
				Math.ceil(lineDimension?.height / this._wrapperDimension.lineHeight) *
				this._wrapperDimension.lineHeight;

			if (height + Paginator.paginationInfo.accumulatedHeight.height > this.getUsableHeight()) {
				if (this.haveChildNodes()) this.createPage();
				if (height + Paginator.paginationInfo.accumulatedHeight.height > this.getUsableHeight()) {
					const paragraphPaginator = new ParagraphPaginator(lineElement as HTMLParagraphElement, this);
					await paragraphPaginator.paginateNode();
					continue;
				}
			}

			Paginator.paginationInfo.accumulatedHeight.height += height;
			this.currentContainer.appendChild(lineElement.cloneNode(true));
		}

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		if (this.haveChildNodes()) {
			this._createPreWrapper();
		} else this._currentPre.remove();

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this._currentPre);

		this.addDimension();
		return this.currentContainer;
	}

	addDimension() {
		this.updateAccumulatedHeightDim(this._wrapperDimension);
	}

	private _getWrapperDimension() {
		const preDimension = Paginator.paginationInfo.nodeDimension.get(this.node);
		const srcWrapperDimension = Paginator.paginationInfo.nodeDimension.get(this._srcWrapper);
		const wrapperDimension = NodeDimensions.combineDimensions(preDimension, srcWrapperDimension);
		wrapperDimension.height = wrapperDimension.height - srcWrapperDimension.height + srcWrapperDimension.paddingH;
		return wrapperDimension;
	}

	private _createPreWrapper() {
		this._currentPre = this.node.cloneNode(false) as HTMLPreElement;
		const currentWrapper = this._srcWrapper.cloneNode(false) as HTMLElement;
		this._currentPre.appendChild(currentWrapper);
		this.currentContainer = currentWrapper;
	}
}

export default CodeBlockPaginator;
