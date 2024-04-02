import { getExecutingEnvironment } from "@app/resolveModule/env";

export const usePlatform = () => {
	const Environment = getExecutingEnvironment();

	const isBrowser = Environment === "browser";
	const isTauri = Environment === "tauri";
	const isNext = Environment === "next";

	return { isBrowser, isTauri, isNext };
};
