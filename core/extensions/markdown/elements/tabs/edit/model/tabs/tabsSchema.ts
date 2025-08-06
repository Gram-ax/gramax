import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const tabsSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: `${ElementGroups.tab}+`,
	defining: true,
	attrs: {
		childAttrs: {
			default: [],
			parseHTML: (node) => {
				return JSON.parse(node.getAttribute("childAttrs") || "[]");
			},
			renderHTML: (attrs) => {
				return {
					childAttrs: JSON.stringify(attrs.childAttrs),
				};
			},
		},
	},
};

export default tabsSchema;
