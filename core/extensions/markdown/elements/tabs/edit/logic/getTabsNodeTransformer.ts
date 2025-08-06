import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type { JSONContent } from "@tiptap/core";

const getTabsNodeTransformer =
	(context: ParserContext): NodeTransformerFunc =>
	(node) => {
		const resolvedFilterProperty = context?.getCatalog?.()?.props?.resolvedFilterProperty;

		if (node?.type !== "tabs" || !resolvedFilterProperty) return { isSet: false, value: node };

		let idx = 0;
		const filter = (tab: JSONContent) => tab.type !== "tab" || tab?.attrs?.name == resolvedFilterProperty;
		node.content = node.content.filter(filter);
		node.content.forEach((tab) => (tab.attrs.idx = idx++));

		if (Array.isArray(node.attrs?.childAttrs)) {
			const filter = (childAttr: JSONContent) => childAttr?.name == resolvedFilterProperty;
			node.attrs.childAttrs = node.attrs.childAttrs.filter(filter);
			let idx = 0;
			node.attrs.childAttrs.forEach((attr: JSONContent) => (attr.idx = idx++));
		}

		return { isSet: true, value: node };
	};

export default getTabsNodeTransformer;
