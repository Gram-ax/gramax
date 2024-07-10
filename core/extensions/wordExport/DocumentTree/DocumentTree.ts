import ResourceManager from "@core/Resource/ResourceManager";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";

export interface DocumentTree {
	name: string;
	content: RenderableTreeNode;
	resourceManager: ResourceManager;
	level: number;
	number: string;
	parserContext: ParserContext;
	children: DocumentTree[];
}

export default DocumentTree;
