import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";
import getWordResourceManager from "@ext/wordExport/getWordResourceManager";

export const plantUMLWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	const resourceManager = await getWordResourceManager(addOptions, wordRenderContext.parserContext);

	return await WordDiagramRenderer.renderSimpleDiagram(
		tag,
		addOptions,
		DiagramType["plant-uml"],
		resourceManager,
		wordRenderContext.parserContext.getLanguage(),
	);
};
