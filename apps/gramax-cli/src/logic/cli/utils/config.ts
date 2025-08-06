import { readFile, exists } from "fs-extra";
import { parse } from "yaml";
import { AppConfig } from "@app/config/AppConfig";
import { logStep } from "./logger";
import ChalkLogger from "../../../utils/ChalkLogger";
import CliUserError from "../../CliUserError";
type AppBuildConfig = Pick<AppConfig, "logo" | "metrics">;

type BuildConfig = {
	logo: AppBuildConfig["logo"];
	metrics: {
		matomo: Omit<AppBuildConfig["metrics"]["matomo"], "matomoSiteId"> & {
			siteId: AppBuildConfig["metrics"]["matomo"]["matomoSiteId"];
		};
	} & Omit<AppBuildConfig["metrics"], "matomo">;
};

export type CliConfig = {
	build: BuildConfig;
	import?: {
		yandex?: {
			headers?: {
				"x-csrf-token"?: string;
				"x-org-id"?: string;
				cookie?: string;
				"x-collab-org-id"?: string;
			};
		};
	};
};

export const loadConfig = async (configPath: string, force = false) => {
	const isExist = await exists(configPath);
	if (!isExist && force) throw new CliUserError(`Configuration file not found at path: ${configPath}`);
	if (!isExist) return {} as CliConfig;

	const fileContents = await logStep("Reading configuration file", () => readFile(configPath, "utf-8"));
	ChalkLogger.log(`Found: ${configPath}`, { indent: 1 });
	return (
		((await logStep("Parsing YAML configuration", () => parse(fileContents), {
			catchF: (e) => new CliUserError(e.message),
		})) as CliConfig) || ({} as CliConfig)
	);
};
