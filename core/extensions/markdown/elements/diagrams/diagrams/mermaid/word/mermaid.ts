import { getExecutingEnvironment } from "@app/resolveModule/env";
import DiagramType from "@core/components/Diagram/DiagramType";
import { getCodeBlock } from "@ext/markdown/elements/codeBlockLowlight/word";
import getWordResourceManager from "@ext/wordExport/getWordResourceManager";
import type { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";

export const mermaidWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	const resourceManager = await getWordResourceManager(
		addOptions,
		wordRenderContext.parserContext,
		wordRenderContext.resourceManager,
	);
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
