import assert from "assert";

export interface NodeDimensionsData {
	height: number;
	marginTop: number;
	marginBottom: number;
	paddingTop: number;
	paddingBottom: number;
	lineHeight: number;
}

export interface AccumulatedHeight {
	height: number;
	marginBottom: number;
}

export class NodeDimensions {
	constructor(private _maxHeight: number, private _dimensions: WeakMap<HTMLElement, NodeDimensionsData>) {}

	static async init(
		maxHeight: number,
		source: HTMLElement,
		yieldTick: () => Promise<void>,
		throwIfAborted?: () => void,
	) {
		const nodeHeights = new WeakMap<HTMLElement, NodeDimensionsData>();
		const allNodes = Array.from(source.querySelectorAll("*"));

		for (let i = 0; i < allNodes.length; i++) {
			throwIfAborted();

			const node = allNodes[i] as HTMLElement;
			const computedStyle = getComputedStyle(node);

			nodeHeights.set(node, {
				height: node.offsetHeight || node.getBoundingClientRect().height || 0,
				marginTop: parseFloat(computedStyle.marginTop) || 0,
				marginBottom: parseFloat(computedStyle.marginBottom) || 0,
				paddingTop: parseFloat(computedStyle.paddingTop) || 0,
				paddingBottom: parseFloat(computedStyle.paddingBottom) || 0,
				lineHeight: this._getLineHeightInPixels(computedStyle) || 0,
			});

			if ((i + 1) % 200 === 0) {
				await yieldTick();
				throwIfAborted();
			}
		}

		return new NodeDimensions(maxHeight, nodeHeights);
	}

	get(node: HTMLElement) {
		return this._dimensions.get(node);
	}

	canUpdateAccumulatedHeight(node: HTMLElement, accumulatedHeight: AccumulatedHeight): boolean {
		const dims = this.get(node);
		if (!dims) return true;

		const collapsedMargin = Math.max(accumulatedHeight.marginBottom, dims.marginTop);
		const newHeight = accumulatedHeight.height + collapsedMargin + dims.height;
		return newHeight <= this._maxHeight;
	}

	updateAccumulatedHeight(node: HTMLElement, accumulatedHeight: AccumulatedHeight = NodeDimensions.createInitial()) {
		const dims = this.get(node);
		if (!dims) return;

		const collapsedMargin =
			accumulatedHeight.height > 0 ? Math.max(accumulatedHeight.marginBottom, dims.marginTop) : 0;
		const newHeight = accumulatedHeight.height + collapsedMargin + dims.height;
		return {
			height: newHeight,
			marginBottom: dims.marginBottom,
		};
	}

	static createInitial(): AccumulatedHeight {
		return { height: 0, marginBottom: 0 };
	}

	private static _getLineHeightInPixels(computedStyle: CSSStyleDeclaration): number {
		const lineHeight = computedStyle.lineHeight;

		if (lineHeight === "normal") return parseFloat(computedStyle.fontSize) * 1.2;
		return parseFloat(lineHeight);
	}

	static combineDimensions(
		parentDim: NodeDimensionsData,
		childDim: NodeDimensionsData,
	): NodeDimensionsData | undefined {
		assert(parentDim && childDim, "Both parentDim and childDim are required");

		return {
			height: parentDim.height || childDim.height || 0,
			lineHeight: childDim.lineHeight || parentDim.lineHeight || 0,
			marginTop: (parentDim.marginTop || 0) + (childDim.marginTop || 0),
			marginBottom: (parentDim.marginBottom || 0) + (childDim.marginBottom || 0),
			paddingTop: (parentDim.paddingTop || 0) + (childDim.paddingTop || 0),
			paddingBottom: (parentDim.paddingBottom || 0) + (childDim.paddingBottom || 0),
		};
	}
}
