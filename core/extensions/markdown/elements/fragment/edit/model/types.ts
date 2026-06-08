import type { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";

export interface FragmentEditorProps {
	title: string;
	id: string;
}

export interface FragmentRenderData extends FragmentEditorProps {
	content: RenderableTreeNode[];
	path?: string;
}
