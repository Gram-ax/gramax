import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const editSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	attrs: { src: { default: null }, title: { default: null }, width: { default: null }, height: { default: null } },
};

export default editSchema;
