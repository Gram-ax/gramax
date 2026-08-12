export type VideoLayout = "horizontal" | "vertical";

const getVideoLayout = (url: string): VideoLayout => {
	try {
		const parsedUrl = new URL(url);
		const hostname = parsedUrl.hostname;
		const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
		const isYoutube = hostname === "youtube.com" || hostname.endsWith(".youtube.com");
		const isInstagram = hostname === "instagram.com" || hostname.endsWith(".instagram.com");

		if (isYoutube && pathSegments[0] === "shorts" && pathSegments[1]) return "vertical";
		if (isInstagram && pathSegments.some((segment) => segment === "reel" || segment === "reels")) return "vertical";
	} catch {
		return "horizontal";
	}

	return "horizontal";
};

export default getVideoLayout;
