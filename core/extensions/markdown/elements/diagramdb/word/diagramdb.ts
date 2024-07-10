import { Paragraph } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import DbDiagram from "../../../../../ui-logic/DbDiagram";
import { defaultLanguage } from "../../../../localization/core/model/Language";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles, diagramString } from "@ext/wordExport/options/wordExportSettings";
import { errorWordLayout } from "@ext/wordExport/error";

export const diagramdbWordLayout: WordBlockChild = async ({ tag, resourceManager, fileProvider, parserContext }) => {
	try {
		const diagram = new DbDiagram(parserContext.getTablesManager(), parserContext.fp);
		const diagramRef = fileProvider.getItemRef(resourceManager.getAbsolutePath(new Path(tag.attributes.src)));
		await diagram.addDiagram(diagramRef, tag.attributes.tags, defaultLanguage, resourceManager.rootPath);

		return [
			new Paragraph({
				children: [await WordExportHelper.getImageFromDiagramString(diagram.getSvg())],
				style: WordFontStyles.picture,
			}),
		];
	} catch {
		return errorWordLayout(diagramString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
