import { FloatAlign } from "@ext/markdown/elements/float/edit/model/types";

export const FLOAT_NODES = ["image", "diagrams", "mermaid", "plant-uml", "ts-diagram", "c4-diagram"];

export const FLOAT_ALIGN_VALUES: FloatAlign[] = ["left", "right", "center"];

export const FLOAT_ALIGN_ICONS: Record<FloatAlign, string> = {
	left: "align-left",
	right: "align-right",
	center: "align-center",
};
