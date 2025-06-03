import { CustomEditTreeToRenderTree } from "@ext/markdown/core/Parser/EditTreeToRenderTree";

const mdEditTreeToRenderTree: CustomEditTreeToRenderTree = (node) => {
	if (!node.attrs?.tag) return;
	return Array.isArray(node.attrs.tag) ? node.attrs.tag.map((tag) => ({ ...tag })) : [{ ...node.attrs.tag }];
};

export default mdEditTreeToRenderTree;
