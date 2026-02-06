import LinkResourceManager from "@core/Link/LinkResourceManager";
import ResourceManager from "@core/Resource/ResourceManager";
import UiLanguage from "@ext/localization/core/model/Language";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";

export interface DocumentTree {
	name: string;
	content: RenderableTreeNode | JSONContent;
	resourceManager: ResourceManager;
	level: number;
	number: string;
	linkResourceManager: LinkResourceManager;
	parserContext: ParserContext;
	children: DocumentTree[];
	language: UiLanguage;
}

export default DocumentTree;
