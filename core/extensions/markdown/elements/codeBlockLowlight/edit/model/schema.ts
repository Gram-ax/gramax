import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const code_block = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	marks: "",
	code: true,
	defining: true,
	content: "text*",
	attrs: { language: { default: null } },
};

export default code_block;
