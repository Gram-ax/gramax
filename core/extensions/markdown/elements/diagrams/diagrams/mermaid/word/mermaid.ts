import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { getCodeBlock } from "@ext/markdown/elements/codeBlockLowlight/word";
import getWordResourceManager from "@ext/wordExport/getWordResourceManager";

export const mermaidWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	const resourceManager = await getWordResourceManager(addOptions, wordRenderContext.parserContext);
	if (getExecutingEnvironment() === "next" || getExecutingEnvironment() === "cli")
		return getCodeBlock(await WordDiagramRenderer.getDiagramContent(tag, resourceManager), undefined, addOptions);

	return await WordDiagramRenderer.renderSimpleDiagram(
		tag,
		addOptions,
		DiagramType.mermaid,
		resourceManager,
		wordRenderContext.parserContext.getLanguage(),
	);
};
