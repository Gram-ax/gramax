import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";
import { errorWordLayout } from "@ext/wordExport/error";
import { diagramString } from "@ext/wordExport/options/wordExportSettings";

export const tsDiagramWordLayout: WordBlockChild = async ({ tag, resourceManager, parserContext }) => {
	try {
		return await WordDiagramRenderer.renderSimpleDiagram(
			tag,
			DiagramType["ts-diagram"],
			resourceManager,
			parserContext.getLanguage(),
			parserContext.getDiagramRendererServerUrl(),
		);
	} catch (error) {
		return errorWordLayout(diagramString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
