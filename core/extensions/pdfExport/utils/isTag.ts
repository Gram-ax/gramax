import { RenderableTreeNode, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";

export function isTag(node?: RenderableTreeNode | JSONContent): node is Tag {
	return typeof node === "object" && node !== null && "name" in node;
}
