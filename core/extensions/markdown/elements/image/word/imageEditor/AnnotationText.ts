import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import { WordFontStyles, wordFontTypes } from "@ext/wordExport/options/wordExportSettings";
import docx from "@dynamicImports/docx";
import type { TextRun as TextRunType } from "docx";

class AnnotationText {
	private static async _createAnnotations(index: number, text: string, isLast: boolean) {
		const { TextRun } = await docx();
		return [
			new TextRun({ children: [`${index + 1}. `], font: wordFontTypes.numbering }),
			new TextRun(text + (isLast ? "" : " ")),
		];
	}

	public static async getText(title?: string, objects: ImageObject[] = [], addOptions?: AddOptionsWord) {
		const { Paragraph, TextRun } = await docx();
		const indent = typeof addOptions?.indent === "number" ? { left: addOptions.indent } : undefined;

		if (!objects.some((object) => object.text))
			return title
				? [new Paragraph({ children: [new TextRun(title)], style: WordFontStyles.pictureTitle, indent })]
				: [];

		const lastIndex = objects.reduce((lastIndex, object, index) => {
			return object.text ? index : lastIndex;
		}, 0);

		const annotations: TextRunType[] = title ? [new TextRun({ break: 1 })] : [];
		for (const [index, object] of objects.entries()) {
			if (object.text) {
				annotations.push(...(await this._createAnnotations(index, object.text, index == lastIndex)));
			}
		}

		return [
			new Paragraph({
				children: [new TextRun(title), ...annotations],
				style: WordFontStyles.pictureTitle,
				indent,
			}),
		];
	}
}

export default AnnotationText;
