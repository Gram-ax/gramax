import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const tsDiagramWordLayout: WordBlockChild = async ({ tag, resourceManager, parserContext }) => {
	return await WordDiagramRenderer.renderSimpleDiagram(
		tag,
		DiagramType["ts-diagram"],
		resourceManager,
		parserContext.getEnterpriseServerUrl(),
	);
};
