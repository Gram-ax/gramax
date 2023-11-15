import path from "path";
import { fileURLToPath } from "url";
import { UserConfig, defineConfig } from "vite";
import baseConfig from "../../vite.config";

process.env.VITE_ENVIRONMENT = "tauri";

export default defineConfig((env) => {
	const config = baseConfig(env);

	config.resolve.alias["fs-extra"] = fileURLToPath(new URL("../../target/tauri/src/tauri", import.meta.url));

	return {
		...config,

		publicDir: "../../core/public",

		build: {
			...config.build,
			rollupOptions: {
				...config.build.rollupOptions,
				input: {
					index: path.resolve(__dirname, "index.html"),
					settings: path.resolve(__dirname, "settings.html"),
					test: path.resolve(__dirname, "test.html"),
				},
			},
		},

		css: null,
	} as UserConfig;
});
