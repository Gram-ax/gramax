export const listItem = {
	block: "listItem",
	getAttrs: (token) => {
		const attrs = Array.isArray(token?.attrs) ? token.attrs : [];

		const cortege = attrs.find((item) => item[0] === "checked") || [];
		if (!cortege.length) return null;

		const [, value] = cortege;

		return { isTaskItem: value === "true" };
	},
};
