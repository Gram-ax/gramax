import ElementGroups from "@ext/markdown/core/element/ElementGroups";
export const listItem = {
	group: ElementGroups.listItem,
	content: `${ElementGroups.listItemContent} ${ElementGroups.block}*`,
	defining: true,
	attrs: {
		isTaskItem: { default: null },
		checked: {
			default: null,
			keepOnSplit: false,
			parseHTML: (element) => {
				const dataChecked = element.getAttribute("data-checked");

				return dataChecked === "" || dataChecked === "true";
			},
			renderHTML: (attributes) =>
				attributes.isTaskItem
					? {
							"data-checked": attributes.checked,
					  }
					: {},
		},
	},
};
