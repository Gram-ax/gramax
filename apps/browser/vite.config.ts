import react from "@vitejs/plugin-react";
import { UserConfig, mergeConfig } from "vite";
import env from "../../scripts/compileTimeEnv.mjs";
import baseConfig from "../../vite.config";

const { setVersion } = env;

process.env.VITE_ENVIRONMENT = "browser";
setVersion("web");

export default mergeConfig(baseConfig(), {
	plugins: [react()],
	publicDir: "../../core/public",
	envDir: "../..",
} as UserConfig);
