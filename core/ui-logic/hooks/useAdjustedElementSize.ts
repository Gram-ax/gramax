import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import { useLayoutEffect, useState } from "react";

interface UseAdjustedElementSizeOptions {
	width?: string;
	height?: string;
	scale?: number | string;
	getParentWidth: () => number;
	getOffset?: () => number;
}

type AdjustedElementSize = { width: string; height: string };

export const useAdjustedElementSize = (props: UseAdjustedElementSizeOptions): AdjustedElementSize => {
	const { width, height, scale, getParentWidth, getOffset } = props;
	const [size, setSize] = useState<AdjustedElementSize>(null);

	useLayoutEffect(() => {
		if (!width?.endsWith("px") || !height?.endsWith("px")) return;
		const parentWidth = getParentWidth();
		if (!parentWidth) return;

		const adjusted = getAdjustedSize(parseFloat(width), parseFloat(height), parentWidth, scale);
		const offset = getOffset?.() ?? 0;
		setSize({ width: `${adjusted.width}px`, height: `${adjusted.height + offset}px` });
	}, [width, height, scale, getParentWidth, getOffset]);

	return size;
};
