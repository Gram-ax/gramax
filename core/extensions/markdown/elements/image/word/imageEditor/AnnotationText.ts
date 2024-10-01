import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { WordFontStyles, wordFontTypes } from "@ext/wordExport/options/wordExportSettings";
import { Paragraph, TextRun } from "docx";

class AnnotationText {
	private static _createAnnotations(index: number, text: string, isLast: boolean) {
		return [
			new TextRun({ children: [`${index + 1}. `], font: wordFontTypes.numbering }),
			new TextRun(text + (isLast ? "" : " ")),
		];
	}

	public static getText(title?: string, objects: ImageObject[] = []) {
		if (!objects.some((object) => object.text))
			return title ? [new Paragraph({ children: [new TextRun(title)], style: WordFontStyles.pictureTitle })] : [];

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
			}),
		];
	}
}

export default AnnotationText;
