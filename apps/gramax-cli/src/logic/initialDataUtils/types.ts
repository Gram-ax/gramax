import type { AppConfig } from "@app/config/AppConfig";
import type { DirectoryInfoBasic } from "@app/resolveModule/fscall/static";
import type { InitialData } from "apps/gramax-cli/src/logic/ArticleTypes";

export enum InitialDataKeys {
	DATA = "__INITIAL_DATA__",
	CONFIG = "__INITIAL_CONFIG__",
	DIRECTORY = "__DIRECTORY__",
}

export type StaticConfig = AppConfig & {
	features: string;
};

export type ExtendedWindow = Window & {
	[InitialDataKeys.DATA]?: InitialData;
	[InitialDataKeys.CONFIG]?: StaticConfig;
	[InitialDataKeys.DIRECTORY]?: DirectoryInfoBasic;
};
