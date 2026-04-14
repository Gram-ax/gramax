import type LinkResourceManager from "@core/Link/LinkResourceManager";
import type ResourceManager from "@core/Resource/ResourceManager";
import type UiLanguage from "@ext/localization/core/model/Language";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import type { JSONContent } from "@tiptap/core";

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
