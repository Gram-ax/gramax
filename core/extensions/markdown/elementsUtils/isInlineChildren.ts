import { RenderableTreeNode } from "../core/render/logic/Markdoc";

export default function isInline(children: RenderableTreeNode[]): boolean {
	return Array.isArray(children)
		? children?.some((ch) => typeof ch === "string")
		: typeof children === "string"
		? true
		: false;
}
