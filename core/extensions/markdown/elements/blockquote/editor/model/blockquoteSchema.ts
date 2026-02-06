import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const blockquote = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: "block+",
};

export default blockquote;
