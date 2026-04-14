import type NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import type { JSONContent } from "@tiptap/core";

const getFilter = (resolvedFilterPropertyValue: string) => (tab: JSONContent) =>
	tab.type !== "tab" || tab?.attrs?.name === resolvedFilterPropertyValue;

const checkTabsNodeFiltered = (node: JSONContent, resolvedFilterPropertyValue: string) => {
	if (node?.type !== "tabs" || !node.content || !resolvedFilterPropertyValue) return true;
	const filter = getFilter(resolvedFilterPropertyValue);
	return !node.content.some(filter);
};

const getTabsNodeTransformer =
	(context: PrivateParserContext): NodeTransformerFunc =>
	(node) => {
		const resolvedFilterPropertyValue = context?.getCatalog?.()?.props?.resolvedFilterPropertyValue;
		if (checkTabsNodeFiltered(node, resolvedFilterPropertyValue)) return { isSet: false, value: node };

		let idx = 0;
		const filter = getFilter(resolvedFilterPropertyValue);
		node.content = node.content.filter(filter);
		node.content.forEach((tab) => {
			tab.attrs.idx = idx++;
		});

		if (Array.isArray(node.attrs?.childAttrs)) {
			const filter = (childAttr: JSONContent) => childAttr?.name === resolvedFilterPropertyValue;
			node.attrs.childAttrs = node.attrs.childAttrs.filter(filter);
			let idx = 0;
			node.attrs.childAttrs.forEach((attr: JSONContent) => {
				attr.idx = idx++;
			});
		}

		return { isSet: true, value: node };
	};

export default getTabsNodeTransformer;
