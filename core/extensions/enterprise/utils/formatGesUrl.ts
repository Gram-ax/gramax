export const formatGesUrl = (url: string) => {
	if (!url) return url;
	return url.replace(/\/+$|(\.[^./]+)\/.*/g, "$1").trim();
};
