import docx from "@dynamicImports/docx";
import t from "@ext/localization/locale/translate";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const seeWordLayout: WordBlockChild = async ({ tag, addOptions }) => {
	const { InternalHyperlink, Paragraph, TextRun } = await docx();
	const id = (tag.attributes.link as string).replace(/^#/, "");
	return await Promise.resolve([
		new Paragraph({
			children: [
				new TextRun({ text: t("see") }),
				new InternalHyperlink({
					anchor: id,
					children: [
						new TextRun({
							text: id,
							style: "Hyperlink",
						}),
					],
				}),
			],
			...addOptions,
		}),
	]);
};
