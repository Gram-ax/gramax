import { AlignmentType, Paragraph } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import DbDiagram from "../../../../../ui-logic/DbDiagram";
import { defaultLanguage } from "../../../../localization/core/model/Language";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordBlockChild } from "../../../../wordExport/WordTypes";

export const diagramdbWordLayout: WordBlockChild = async ({ tag, resourceManager, fileProvider, parserContext }) => {
	const tablesManager = parserContext.getTablesManager();
	const diagram = new DbDiagram(tablesManager);

	const diagramRef = fileProvider.getItemRef(resourceManager.getAbsolutePath(new Path(tag.attributes.src)));
	await diagram.addDiagram(diagramRef, tag.attributes.tags, defaultLanguage, resourceManager.rootPath);

	return [
		new Paragraph({
			children: [await WordExportHelper.getImageFromSvgString(diagram.getSvg(), false)],
			alignment: AlignmentType.CENTER,
		}),
	];
};
