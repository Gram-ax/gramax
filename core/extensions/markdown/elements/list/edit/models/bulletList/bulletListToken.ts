import listIsTight from "../../logic/listIsTight";

export const CONTAINS_TASK_LIST = "contains-task-list";

export const bullet_list = {
	block: "bullet_list",
	getAttrs: (token, tokens, i) => {
		const attrs = Array.isArray(token?.attrs) ? token.attrs : [];

		const tight = listIsTight(tokens, i);
		const result: { tight: boolean; containTaskList: boolean } = { tight, containTaskList: false };

		const cortege = attrs.find(([key]) => key === CONTAINS_TASK_LIST) || [];
		if (!cortege.length) return result;

		const [, value] = cortege;

		result.containTaskList = value === "true";

		return result;
	},
};
