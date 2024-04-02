import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";

interface SnippetRenderData extends SnippetEditorProps {
	content: RenderableTreeNode[];
}

export default SnippetRenderData;
