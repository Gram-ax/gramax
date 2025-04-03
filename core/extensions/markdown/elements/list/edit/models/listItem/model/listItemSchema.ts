export const simpleContent = "paragraph block*";
export const complexContent = "(paragraph|diagrams|image|drawio|snippet|html|openapi|video|view)+ block*";

export const listItem = {
	group: "listItem",
	content: complexContent,
	defining: true,
	attrs: {
		isTaskItem: { default: null },
	},
};
