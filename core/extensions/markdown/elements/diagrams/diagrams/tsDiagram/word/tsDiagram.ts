import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const tsDiagramWordLayout: WordBlockChild = async ({ tag, resourceManager, fileProvider, parserContext }) => {
	return await WordDiagramRenderer.renderSimpleDiagram(tag, DiagramType["ts-diagram"], resourceManager, fileProvider, parserContext.getEnterpriseServerUrl());
};
