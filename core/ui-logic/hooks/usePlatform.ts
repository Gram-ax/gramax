import PlatformService from "@core-ui/ContextServices/PlatformService";

export const usePlatform = () => {
	const Environment = PlatformService.value;

	const isBrowser = Environment === "browser";
	const isTauri = Environment === "tauri";
	const isNext = Environment === "next";
	const isStaticCli = Environment === "cli";
	const isStatic = Environment === "static";

	return { isBrowser, isTauri, isNext, isStaticCli, isStatic, environment: Environment };
};
