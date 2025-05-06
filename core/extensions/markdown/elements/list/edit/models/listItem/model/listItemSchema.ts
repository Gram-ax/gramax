import ElementGroups from "@ext/markdown/core/element/ElementGroups";
export const listItem = {
	group: ElementGroups.listItem,
	content: `${ElementGroups.listItemContent} block*`,
	defining: true,
	attrs: {
		isTaskItem: { default: null },
	},
};
