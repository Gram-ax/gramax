import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import { WordFontStyles, wordFontTypes } from "@ext/wordExport/options/wordExportSettings";
import { Paragraph, TextRun } from "docx";

class AnnotationText {
	private static _createAnnotations(index: number, text: string, isLast: boolean) {
		return [
			new TextRun({ children: [`${index + 1}. `], font: wordFontTypes.numbering }),
			new TextRun(text + (isLast ? "" : " ")),
		];
	}

	public static getText(title?: string, objects: ImageObject[] = [], addOptions?: AddOptionsWord) {
		const indent = typeof addOptions?.indent === "number" ? { left: addOptions.indent } : undefined;

		if (!objects.some((object) => object.text))
			return title
				? [new Paragraph({ children: [new TextRun(title)], style: WordFontStyles.pictureTitle, indent })]
				: [];

		const lastIndex = objects.reduce((lastIndex, object, index) => {
			return object.text ? index : lastIndex;
		}, 0);

		const annotations: TextRun[] = title ? [new TextRun({ break: 1 })] : [];
		objects.forEach((object, index) => {
			if (object.text) annotations.push(...this._createAnnotations(index, object.text, index == lastIndex));
		});

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
