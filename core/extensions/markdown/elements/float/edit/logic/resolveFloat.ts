import { FloatAlign } from "@ext/markdown/elements/float/edit/model/types";

export const resolveFloat = (float: FloatAlign): FloatAlign => {
	if (float === "center") return undefined;
	return float;
};
