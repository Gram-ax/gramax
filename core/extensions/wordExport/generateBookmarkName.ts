export const generateBookmarkName = (order: string, title: string, id?: string): string => {
	return `${order}${title.replace(/ /g, "_")}${id ? `_${id}` : ""}`;
};
