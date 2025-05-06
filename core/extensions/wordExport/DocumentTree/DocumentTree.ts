import ResourceManager from "@core/Resource/ResourceManager";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";

export interface DocumentTree {
	name: string;
	content: RenderableTreeNode | JSONContent;
	resourceManager: ResourceManager;
	level: number;
	number: string;
	parserContext: ParserContext;
	children: DocumentTree[];
}

export default DocumentTree;
