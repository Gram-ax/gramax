import { RenderableTreeNode, Tag } from "@ext/markdown/core/render/logic/Markdoc";

export function isTag(node?: RenderableTreeNode): node is Tag {
	return typeof node === "object" && node !== null && "name" in node;
}
