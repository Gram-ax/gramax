import { Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { getBlockChilds } from "../../../../wordExport/getBlockChilds";
import { Tag } from "../../../core/render/logic/Markdoc";

export const listItemWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const filteredChildrens = tag.children.filter((child) => child && typeof child !== "string") as Tag[];
	const blockLayouts = getBlockChilds();
	const listElements = [];
	let paragraph = [];
	for (let i = 0; i < filteredChildrens.length; i++) {
		const child = filteredChildrens[i];

		if (child.name === "p") {
			const inlineElements = await state.renderInline(child);
			paragraph.push([
				...inlineElements.flat().filter((val) => val),
				...(inlineElements &&
				tag.children.length > 1 &&
				(!blockLayouts[(tag.children[i + 1] as Tag)?.name] || (tag.children[i + 1] as Tag)?.name === "p")
					? [new TextRun({ text: "", break: 1 })]
					: []),
			]);

			continue;
		}

		if (paragraph.length > 0) {
			listElements.push(
				new Paragraph({
					children: paragraph.flat(),
					...addOptions,
				}),
			);
			paragraph = [];
		}

		listElements.push(await state.renderBlock(child));
	}

	if (paragraph.length > 0) {
		listElements.push(
			new Paragraph({
				children: paragraph.flat(),
				...addOptions,
			}),
		);
	}

	return listElements.flat();
};
