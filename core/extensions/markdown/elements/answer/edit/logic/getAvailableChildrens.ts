import type { AnswerType } from "../../types";

export const getAvailableChildrens = (type: AnswerType, isReadonly: boolean = false) => {
	if (isReadonly) return { right: false, left: false, content: true };
	return type === "text" ? { right: false, left: false, content: true } : { right: true, left: true, content: true };
};
