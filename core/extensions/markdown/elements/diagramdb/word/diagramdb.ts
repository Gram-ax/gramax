import { Paragraph } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import DbDiagram from "../../../../../ui-logic/DbDiagram";
import { defaultLanguage } from "../../../../localization/core/model/Language";
import { WordImageProcessor } from "../../image/word/WordImageProcessor";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles, diagramString } from "@ext/wordExport/options/wordExportSettings";
import { errorWordLayout } from "@ext/wordExport/error";

export const diagramdbWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	try {
		const diagram = new DbDiagram(wordRenderContext.parserContext.getTablesManager(), wordRenderContext.parserContext.fp);

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
				children: [await WordImageProcessor.getImageFromDiagramString(diagram.getSvg())],
				style: WordFontStyles.picture,
			}),
		];
	} catch {
		return errorWordLayout(diagramString(wordRenderContext.parserContext.getLanguage()), wordRenderContext.parserContext.getLanguage());
	}
};
