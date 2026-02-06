import docx from "@dynamicImports/docx";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import { errorWordLayout } from "@ext/wordExport/error";
import { diagramString, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import Path from "../../../../../logic/FileProvider/Path/Path";
import DbDiagram from "../../../../../ui-logic/DbDiagram";
import { resolveLanguage } from "../../../../localization/core/model/Language";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const diagramdbWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	try {
		const { Paragraph } = await docx();
		const diagram = new DbDiagram(
			wordRenderContext.parserContext.getTablesManager(),
			wordRenderContext.parserContext.fp,
		);

		const diagramRef = wordRenderContext.parserContext.fp.getItemRef(
			wordRenderContext.resourceManager.getAbsolutePath(new Path(tag.attributes.src)),
		);
		await diagram.addDiagram(
			diagramRef,
			tag.attributes.tags,
			resolveLanguage(),
			wordRenderContext.resourceManager.rootPath,
		);

		return [
			new Paragraph({
				children: [await WordImageExporter.getImageFromDiagramString(diagram.draw())],
				style: WordFontStyles.picture,
			}),
		];
	} catch {
		return errorWordLayout(
			diagramString(wordRenderContext.parserContext.getLanguage()),
			wordRenderContext.parserContext.getLanguage(),
		);
	}
};
