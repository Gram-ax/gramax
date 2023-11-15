import { UserConfig, defineConfig } from "vite";
import env from "../../scripts/compileTimeEnv.mjs";
import baseConfig from "../../vite.config";

const { setVersion } = env;

process.env.VITE_ENVIRONMENT = "browser";
setVersion("web");

export default defineConfig((env): UserConfig => {
	const config = baseConfig(env);
	return {
		...config,

		publicDir: "../../core/public",
		css: null,
	} as UserConfig;
});
