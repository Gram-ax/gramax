import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const mermaidWordLayout: WordBlockChild = async ({ tag, resourceManager, parserContext }) => {
	return await WordDiagramRenderer.renderSimpleDiagram(tag, DiagramType.mermaid, resourceManager, parserContext.getLanguage());
};
