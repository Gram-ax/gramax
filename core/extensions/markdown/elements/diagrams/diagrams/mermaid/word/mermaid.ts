import DiagramType from "@core/components/Diagram/DiagramType";
import { WordBlockChild } from "../../../../../../wordExport/options/WordTypes";
import { WordDiagramRenderer } from "../../../word/WordDiagramRenderer";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { getCodeBlock } from "@ext/markdown/elements/codeBlockLowlight/word";

export const mermaidWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	if (getExecutingEnvironment() === "next")
		return getCodeBlock(
			[await WordDiagramRenderer.getDiagramContent(tag, wordRenderContext.parserContext.getResourceManager())],
			addOptions,
		);

	return await WordDiagramRenderer.renderSimpleDiagram(
		tag,
		addOptions,
		DiagramType.mermaid,
		wordRenderContext.parserContext.getResourceManager(),
		wordRenderContext.parserContext.getLanguage(),
	);
};
