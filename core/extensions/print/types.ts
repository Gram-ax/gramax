import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ResourceManager from "@core/Resource/ResourceManager";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";

export type PrintMode = "pdf" | "paper";

export type ArticlePreview = {
	title: string;
	apiUrlCreator: ApiUrlCreator;
	content: RenderableTreeNodes;
};
export interface PrintablePage {
	title: string;
	content: RenderableTreeNodes;
	resources: ResourceManager;
	itemRefPath: string;
}
