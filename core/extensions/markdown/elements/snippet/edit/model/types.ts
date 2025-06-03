import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";

export interface SnippetEditorProps {
	title: string;
	id: string;
}

export interface SnippetRenderData extends SnippetEditorProps {
	content: RenderableTreeNode[];
}

