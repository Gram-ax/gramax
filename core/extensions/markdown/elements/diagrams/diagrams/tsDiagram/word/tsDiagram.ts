import DiagramType from "@core/components/Diagram/DiagramType";
import { errorWordLayout } from "@ext/wordExport/error";
import { diagramString } from "@ext/wordExport/options/wordExportSettings";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const tsDiagramWordLayout: WordBlockChild = async ({ tag, addOptions, resourceManager, parserContext }) => {
	try {
		return await WordDiagramRenderer.renderSimpleDiagram(
			tag,
			addOptions,
			DiagramType["ts-diagram"],
			resourceManager,
			parserContext.getLanguage(),
			parserContext.getDiagramRendererServerUrl(),
		);
	} catch (error) {
		return errorWordLayout(diagramString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
