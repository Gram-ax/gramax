import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const paragraphSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: `${ElementGroups.inline}*`,
};

export default paragraphSchema;
