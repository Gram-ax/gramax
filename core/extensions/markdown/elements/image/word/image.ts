import { TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const imageWordLayout: WordInlineChild = async ({ tag, resourceManager, fileProvider }) => {
	return [
		await WordExportHelper.getImageByPath(new Path(tag.attributes.src), resourceManager, fileProvider),
		...(tag.attributes.title ? [new TextRun({ text: tag.attributes.title })] : []),
	];
};
