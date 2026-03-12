import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { NodeDimensionsData } from "@ext/print/utils/pagination/NodeDimensions";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import someParentHaveChildNodes from "@ext/print/utils/pagination/utils/someParentHaveChildNodes";

class ImagePaginator extends NodePaginator<HTMLDivElement> {
	private _minScale: number = null;
	private _splitSize: number = null;

	setImageMaxScaleSize() {
		const styles = window.getComputedStyle(this.node);
		const minScale = parseFloat(styles.getPropertyValue("--pdf-min-scale")) || null;
		const splitSize = parseFloat(styles.getPropertyValue("--pdf-split-scale")) || null;
		this._minScale = minScale;
		this._splitSize = splitSize || this._minScale;
	}

	async paginateNode() {
		this.setImageMaxScaleSize();
		await this._setImage();
		await Paginator.controlInfo.yieldTick();
		throwIfAborted(Paginator.controlInfo.signal);
	}

	createPage() {
		this.parentPaginator.createPage();
		return this.parentPaginator.currentContainer;
	}

	private async _setImage() {
		if (this.parentPaginator.tryFitElement(this.node)) return;

		if (someParentHaveChildNodes(this)) {
			this.createPage();
			if (this.parentPaginator.tryFitElement(this.node)) return;
		}

		if (this._setWithScale()) return;
		await this._setIntPages();
	}

	private _setScale(scale: number, image: HTMLDivElement) {
		const height = this.nodeDimension.height;
		const firstElementChild = image.firstElementChild as HTMLElement;
		this.parentPaginator.currentContainer.appendChild(image);
		firstElementChild.style.transform = `scale(${scale})`;
		firstElementChild.style.transformOrigin = "top";
		image.style.height = `${height * scale}px`;
		image.style.setProperty("overflow", "hidden", "important");
	}

	private _setWithScale() {
		const acceptablEheight = this.getUsableHeight() - Paginator.paginationInfo.accumulatedHeight.height;
		const scale = acceptablEheight / this.nodeDimension.height;
		const canScale = scale >= this._minScale;

		if (this._minScale && !canScale) return;

		this._setScale(scale, this.node);
		this.parentPaginator.currentContainer.appendChild(this.node);

		const newDimensions: NodeDimensionsData = {
			height: acceptablEheight,
			marginBottom: 0,
			marginTop: 0,
			paddingH: 0,
		};
		this.updateAccumulatedHeightDim(newDimensions);

		return true;
	}

	private async _setIntPages() {
		const usableHeight = this.getUsableHeight() - Paginator.paginationInfo.accumulatedHeight.height;
		const splitSize = this._splitSize;
		const totalHeight = this.nodeDimension.height * splitSize;
		const pageCount = Math.ceil(totalHeight / usableHeight);

		for (let i = 0; i < pageCount; i++) {
			await Paginator.controlInfo.yieldTick();
			throwIfAborted(Paginator.controlInfo.signal);
			if (i) this.createPage();

			const startY = i * usableHeight;
			const partHeight = Math.min(usableHeight, totalHeight - startY);

			const viewport = document.createElement("div");
			viewport.dataset.pdfViewport = "true";
			viewport.style.height = `${partHeight}px`;
			viewport.style.setProperty("overflow", "hidden", "important");
			viewport.style.position = "relative";
			viewport.style.boxSizing = "border-box";

			const clipTop = startY;
			const clipBottom = totalHeight - (startY + partHeight);

			const part = this.node.cloneNode(true) as HTMLDivElement;
			this._setScale(splitSize, part);
			part.style.position = "absolute";
			part.style.left = "0";
			part.style.top = `${-clipTop}px`;
			part.style.width = "100%";

			part.style.clipPath = `inset(${clipTop}px 0 ${clipBottom}px 0)`;

			viewport.appendChild(part);
			this.parentPaginator.currentContainer.appendChild(viewport);

			const newDimensions: NodeDimensionsData = {
				height: partHeight,
				marginBottom: 0,
				marginTop: 0,
				paddingH: 0,
			};
			this.updateAccumulatedHeightDim(newDimensions);
		}

		this.node.remove();
	}
}

export default ImagePaginator;
