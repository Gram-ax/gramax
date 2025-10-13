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

export type ArticlePreview = {
	title: string;
	level: number;
	apiUrlCreator: ApiUrlCreator;
	content: RenderableTreeNodes;
};
export interface PrintablePage {
	title: string;
	level: number;
	content: RenderableTreeNodes;
	resources: ResourceManager;
	itemRefPath: string;
	number?: string;
}
