import { Paragraph } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordBlockChild } from "../../../../wordExport/WordTypes";

export const drawioWordLayout: WordBlockChild = async ({ tag, resourceManager }) => {
	return [
		new Paragraph({
			children: [await WordExportHelper.getImageFromSvgPath(new Path(tag.attributes.src), resourceManager)],
		}),
	];
};
