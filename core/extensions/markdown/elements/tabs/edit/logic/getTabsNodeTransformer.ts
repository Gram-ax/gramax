import type NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import type { PropertyValue } from "@ext/properties/models";
import type { JSONContent } from "@tiptap/core";

const getTabsNodeTransformer =
	(context: PrivateParserContext): NodeTransformerFunc =>
	(node) => {
		const resolvedView = context?.getCatalog?.()?.props?.resolvedView;

		if (node?.type !== "tabs" || !resolvedView) return { isSet: false, value: node };

		const tabMatchesView = (tabProperties: PropertyValue[]): boolean => {
			if (!resolvedView.filters || resolvedView.filters.length === 0) return true;

			return resolvedView.filters.every((filter) => {
				const tabProperty = tabProperties?.find((p) => p.id === filter.id);

				if (tabProperty && filter.value?.some((val) => tabProperty.value?.includes(val))) return false;

				if (filter.value?.includes("yes")) return !tabProperty;
				if (filter.value?.includes("none")) return !!tabProperty;

				return true;
			});
		};

		const tabNodes = node.content?.filter((child) => child.type === "tab") ?? [];
		const anyTabHasProperty = tabNodes.some(
			(tab) => Array.isArray(tab.attrs?.property) && (tab.attrs.property as PropertyValue[]).length > 0,
		);
		if (!anyTabHasProperty) return { isSet: false, value: node };

		const keptIndexes = new Set<number>();
		let idx = 0;
		node.content = node.content.filter((tab, index) => {
			if (tab.type !== "tab") return true;
			const keep = tabMatchesView(tab.attrs.property as PropertyValue[]);
			if (keep) keptIndexes.add(index);
			return keep;
		});
		node.content.forEach((tab) => {
			tab.attrs.idx = idx++;
		});

		if (Array.isArray(node.attrs?.childAttrs)) {
			node.attrs.childAttrs = node.attrs.childAttrs.filter((_: JSONContent, index: number) =>
				keptIndexes.has(index),
			);
			let idx = 0;
			node.attrs.childAttrs.forEach((attr: JSONContent) => {
				attr.idx = idx++;
			});
		}

		return { isSet: true, value: node };
	};

export default getTabsNodeTransformer;
