export const textSelector = "text, tspan, foreignObject p, foreignObject span";

export function isTextNodeName(nodeName: string): boolean {
	return nodeName === "text" || nodeName === "tspan" || nodeName === "p" || nodeName === "span";
}
