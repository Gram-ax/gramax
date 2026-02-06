import assert from "assert";

export interface NodeDimensionsData {
	height: number;
	marginTop: number;
	marginBottom: number;
	paddingH: number;
	lineHeight?: number;
	breakBefore?: string;
}

export interface AccumulatedHeight {
	height: number;
	marginBottom: number;
}

export class NodeDimensions {
	constructor(private _dimensions: WeakMap<HTMLElement, NodeDimensionsData>) {}

	static async init(source: HTMLElement, yieldTick: () => Promise<void>, throwIfAborted?: () => void) {
		const nodeDimensions = new WeakMap<HTMLElement, NodeDimensionsData>();
		const allNodes = Array.from(source.querySelectorAll("*"));
		for (let i = 0; i < allNodes.length; i++) {
			throwIfAborted();

			const node = allNodes[i] as HTMLElement;
			const computedStyle = getComputedStyle(node);

			nodeDimensions.set(node, {
				height: node.offsetHeight || node.getBoundingClientRect().height || 0,
				marginTop: parseFloat(computedStyle.marginTop) || 0,
				marginBottom: parseFloat(computedStyle.marginBottom) || 0,
				paddingH: (parseFloat(computedStyle.paddingTop) || 0) + (parseFloat(computedStyle.paddingBottom) || 0),
				lineHeight: NodeDimensions._getLineHeightInPixels(computedStyle) || 0,
				breakBefore: computedStyle.breakBefore,
			});

			if ((i + 1) % 200 === 0) {
				await yieldTick();
				throwIfAborted();
			}
		}

		return new NodeDimensions(nodeDimensions);
	}

	get(node: HTMLElement) {
		return this._dimensions.get(node);
	}

	canUpdateAccumulatedHeight(node: HTMLElement, accumulatedHeight: AccumulatedHeight, height: number): boolean {
		const dims = this.get(node);
		if (!dims) return true;

		const collapsedMargin = Math.max(accumulatedHeight.marginBottom, dims.marginTop);
		const newHeight = accumulatedHeight.height + collapsedMargin + dims.height + dims.marginBottom;
		return newHeight <= height;
	}

	updateAccumulatedHeightNode(
		node: HTMLElement,
		accumulatedHeight: AccumulatedHeight = NodeDimensions.createInitial(),
	) {
		const dims = this.get(node);
		if (!dims) return;

		return this.updateAccumulatedHeightDim(dims, accumulatedHeight);
	}

	updateAccumulatedHeightDim(
		dimension: NodeDimensionsData,
		accumulatedHeight: AccumulatedHeight = NodeDimensions.createInitial(),
	) {
		const collapsedMargin = Math.max(accumulatedHeight.marginBottom, dimension.marginTop);
		const newHeight =
			accumulatedHeight.height +
			collapsedMargin +
			dimension.height -
			accumulatedHeight.marginBottom +
			dimension.marginBottom;
		return {
			height: newHeight,
			marginBottom: dimension.marginBottom,
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
			height: parentDim.height || childDim.height,
			lineHeight: childDim.lineHeight || parentDim.lineHeight,
			marginTop: parentDim.marginTop + childDim.marginTop,
			marginBottom: parentDim.marginBottom + childDim.marginBottom,
			paddingH: parentDim.paddingH + childDim.paddingH,
		};
	}

	static concatDimensions(
		firstDim: NodeDimensionsData,
		secondDim: NodeDimensionsData,
	): NodeDimensionsData | undefined {
		assert(firstDim && secondDim, "Both parentDim and childDim are required");

		return {
			height: firstDim.height + secondDim.height,
			marginTop: firstDim.marginTop,
			marginBottom: secondDim.marginBottom,
			paddingH: firstDim.paddingH + secondDim.paddingH + Math.max(firstDim.marginBottom, secondDim.marginTop),
		};
	}
}
