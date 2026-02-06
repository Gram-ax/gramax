import type { AppConfig } from "@app/config/AppConfig";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type { InitialData } from "apps/gramax-cli/src/logic/ArticleTypes";

export type FileInfoBasic = Pick<FileInfo, "type" | "name">;

export interface DirectoryInfoBasic extends FileInfoBasic {
	type: "dir";
	children: (FileInfoBasic | DirectoryInfoBasic)[];
}

export enum InitialDataKeys {
	DATA = "__INITIAL_DATA__",
	CONFIG = "__INITIAL_CONFIG__",
	DIRECTORY = "__DIRECTORY__",
	ZIP_FILENAME = "__ZIP_FILENAME__",
}

export type StaticConfig = AppConfig & {
	features: string;
};

export type ExtendedWindow = Window & {
	[InitialDataKeys.DATA]?: InitialData;
	[InitialDataKeys.CONFIG]?: StaticConfig;
	[InitialDataKeys.DIRECTORY]?: DirectoryInfoBasic;
	[InitialDataKeys.ZIP_FILENAME]?: string;
};
