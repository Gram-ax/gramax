import isURL from "@core-ui/utils/isURL";
import type { Mark } from "@tiptap/pm/model";

export const getHref = (mark: Mark) => {
	const { attrs } = mark;
	if (attrs?.newHref) return attrs.newHref;

	const href = attrs.href;
	if (typeof href === "string" && href.startsWith("#") && href.length > 1) {
		return href + (mark?.attrs?.hash ?? "");
	}

	const isUrl = isURL(href);
	return (isUrl || href.startsWith("/") ? href : "/" + href) + (mark?.attrs?.hash ?? "");
};
