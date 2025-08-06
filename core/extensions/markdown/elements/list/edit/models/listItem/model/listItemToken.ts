import { CHECKED_ATTR } from "@ext/markdown/elements/list/edit/models/listItem/model/listItem";

export const listItem = {
	block: "listItem",
	getAttrs: (token) => {
		const attrs = Array.isArray(token?.attrs) ? token.attrs : [];

		const cortege = attrs.find((item) => item[0] === CHECKED_ATTR) || [];
		if (!cortege.length) return null;

		const [, value] = cortege;

		return { isTaskItem: true, checked: value === "true" };
	},
};
