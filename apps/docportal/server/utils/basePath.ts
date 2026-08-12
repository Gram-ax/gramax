import { getBasePath } from "../../client/logic/basePath";

export const applyBasePath = (url: URL): Response | null => {
	const basePath = getBasePath();
	if (!basePath) return null;
	if (url.pathname === "/") {
		return new Response(null, {
			status: 302,
			headers: { Location: `${basePath}${url.search}`, "Cache-Control": "no-store" },
		});
	}
	if (url.pathname === basePath || url.pathname.startsWith(`${basePath}/`)) {
		url.pathname = url.pathname.slice(basePath.length) || "/";
	}
	return null;
};
