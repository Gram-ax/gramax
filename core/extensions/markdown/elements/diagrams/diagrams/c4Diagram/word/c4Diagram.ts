import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const c4DiagramWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	return await WordDiagramRenderer.renderC4Diagram(
		tag,
		addOptions,
		DiagramType["c4-diagram"],
		wordRenderContext.parserContext.getResourceManager(),
		wordRenderContext.parserContext.getLanguage(),
		wordRenderContext.parserContext.getDiagramRendererServerUrl(),
	);
};
