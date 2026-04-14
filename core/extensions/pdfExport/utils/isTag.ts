import type { RenderableTreeNode, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import type { JSONContent } from "@tiptap/core";

export function isTag(node?: RenderableTreeNode | JSONContent): node is Tag {
	return typeof node === "object" && node !== null && "name" in node;
}
