import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const plantUMLWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	return await WordDiagramRenderer.renderSimpleDiagram(
		tag,
		addOptions,
		DiagramType["plant-uml"],
		wordRenderContext.parserContext.getResourceManager(),
		wordRenderContext.parserContext.getLanguage(),
	);
};
