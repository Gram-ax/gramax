import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const viewSchema = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	draggable: true,
	disableDropCursor: true,
	attrs: {
		defs: { default: [] },
		orderby: { default: [] },
		groupby: { default: [] },
		select: { default: [] },
		display: { default: "List" },
	},
};

export default viewSchema;
