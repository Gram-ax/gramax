export const list_item = {
	block: "list_item",
	getAttrs: (token) => {
		const attrs = Array.isArray(token?.attrs) ? token.attrs : [];

		const cortege = attrs.find((item) => item[0] === "checked") || [];
		if (!cortege.length) return null;

		const [, value] = cortege;

		return { isTaskItem: value === "true" };
	},
};
