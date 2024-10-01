import DiagramType from "@core/components/Diagram/DiagramType";
import { errorWordLayout } from "@ext/wordExport/error";
import { diagramString } from "@ext/wordExport/options/wordExportSettings";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const tsDiagramWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	try {
		return await WordDiagramRenderer.renderSimpleDiagram(
			tag,
			addOptions,
			DiagramType["ts-diagram"],
			wordRenderContext.parserContext.getResourceManager(),
			wordRenderContext.parserContext.getLanguage(),
			wordRenderContext.parserContext.getDiagramRendererServerUrl(),
		);
	} catch (error) {
		return errorWordLayout(diagramString(wordRenderContext.parserContext.getLanguage()), wordRenderContext.parserContext.getLanguage());
	}
};
