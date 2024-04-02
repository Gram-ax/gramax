import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const c4DiagramWordLayout: WordBlockChild = async ({ tag, resourceManager, parserContext }) => {
	return await WordDiagramRenderer.renderC4Diagram(
		tag,
		DiagramType["c4-diagram"],
		resourceManager,
		parserContext.getDiagramRendererServerUrl(),
	);
};
