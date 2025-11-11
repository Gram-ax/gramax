import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ResourceManager from "@core/Resource/ResourceManager";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";

export type PrintMode = "pdf" | "paper";

export interface PdfPrintParams {
	titlePage: boolean;
	tocPage: boolean;
	titleNumber: boolean;
	template?: string;
}

export type PdfExportStage = "exporting" | "printing" | "cancelled";

export interface PdfExportProgress {
	stage: PdfExportStage;
	ratio?: number;
	cliMessage?: CliPrintStatus;
}

export interface PrintableContent<T> {
	title: string;
	items: T[];
}

export type ArticlePreview = {
	title: string;
	level: number;
	apiUrlCreator: ApiUrlCreator;
	content: RenderableTreeNodes;
	logicPath: string;
};
export interface PrintablePage {
	title: string;
	level: number;
	content: RenderableTreeNodes;
	resources: ResourceManager;
	itemRefPath: string;
	logicPath: string;
	number?: string;
}

export interface PaginateIntoPagesOptions {
	signal?: AbortSignal;
	throttleUnits?: number;
}

export type CliPrintStatus =
	| "start-data-load"
	| "error-data-load"
	| "done-render"
	| `done-print-element-${number}/${number}|-pages-${number}`
	| `done-print-document-${number}`
	| "done";

export type CliOnProgress = (status: CliPrintStatus) => void;
