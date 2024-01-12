import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const plantUMLWordLayout: WordBlockChild = async ({ tag, resourceManager }) => {
	return await WordDiagramRenderer.renderSimpleDiagram(tag, DiagramType["plant-uml"], resourceManager);
};
