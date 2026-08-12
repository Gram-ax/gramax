import type { CSSProperties } from "react";

export const columnWidthStyle = (size: number | undefined): CSSProperties | undefined =>
	size === 0 ? {} : { width: `${size}px` };
