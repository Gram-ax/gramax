declare global {
	interface Window {
		// biome-ignore lint/style/useNamingConvention: global injected by SSR
		__BASE_PATH__: string;
	}
}

export const getBasePath = (): string => {
	const raw = typeof window !== "undefined" ? (window.__BASE_PATH__ ?? "") : (process.env.BASE_PATH ?? "");
	return raw.replace(/\/$/, "");
};

export const stripBasePath = (rawPath: string): string => {
	const basePath = getBasePath();
	if (basePath && (rawPath === basePath || rawPath.startsWith(`${basePath}/`)))
		return rawPath.slice(basePath.length) || "/";
	return rawPath;
};

export const prependBasePath = (url: string): string => {
	const basePath = getBasePath();
	if (!basePath || url === basePath || url.startsWith(`${basePath}/`)) return url;
	return `${basePath}${url}`;
};
