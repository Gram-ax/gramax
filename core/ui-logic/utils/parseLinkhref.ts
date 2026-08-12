import type Url from "@core-ui/ApiServices/Types/Url";

export const parseLinkHref = (href: Url) => {
	const pathname = href.pathname;

	return !pathname.startsWith("/") && !pathname.startsWith("#") && !pathname.startsWith("?")
		? `/${pathname}`
		: pathname;
};
