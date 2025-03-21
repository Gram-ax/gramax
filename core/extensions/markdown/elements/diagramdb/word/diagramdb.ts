import { Paragraph } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import DbDiagram from "../../../../../ui-logic/DbDiagram";
import { defaultLanguage } from "../../../../localization/core/model/Language";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles, diagramString } from "@ext/wordExport/options/wordExportSettings";
import { errorWordLayout } from "@ext/wordExport/error";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";

export const diagramdbWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	try {
		const diagram = new DbDiagram(
			wordRenderContext.parserContext.getTablesManager(),
			wordRenderContext.parserContext.fp,
		);

		const diagramRef = wordRenderContext.parserContext.fp.getItemRef(
			wordRenderContext.parserContext.getResourceManager().getAbsolutePath(new Path(tag.attributes.src)),
		);
		await diagram.addDiagram(
			diagramRef,
			tag.attributes.tags,
			defaultLanguage,
			wordRenderContext.parserContext.getResourceManager().rootPath,
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
