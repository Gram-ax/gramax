import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const plantUMLWordLayout: WordBlockChild = async ({ tag, addOptions, resourceManager, parserContext }) => {
	return await WordDiagramRenderer.renderSimpleDiagram(
		tag,
		addOptions,
		DiagramType["plant-uml"],
		resourceManager,
		parserContext.getLanguage(),
	);
};
