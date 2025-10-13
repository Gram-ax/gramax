import { AppConfig } from "@app/config/AppConfig";
import { DirectoryInfoBasic } from "@app/resolveModule/fscall/static";
import { InitialData } from "./ArticleTypes";
import assert from "assert";

export enum InitialDataKeys {
	DATA = "__INITIAL_DATA__",
	CONFIG = "__INITIAL_CONFIG__",
	DIRECTORY = "__DIRECTORY__",
}

export type ExtendedWindow = Window & {
	[InitialDataKeys.DATA]?: InitialData;
	[InitialDataKeys.CONFIG]?: AppConfig;
	[InitialDataKeys.DIRECTORY]?: DirectoryInfoBasic;
};

export const getCatalogNameFromInitialData = (): string => {
	const extendedWindow = window as ExtendedWindow;
	const data = extendedWindow[InitialDataKeys.DATA];

	assert(data, "Initial data not found");
	return data.data.catalogProps.name;
};
