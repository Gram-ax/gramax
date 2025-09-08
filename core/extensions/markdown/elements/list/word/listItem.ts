import { imageWordLayout } from "@ext/markdown/elements/image/word/image";
import { STANDARD_PAGE_WIDTH, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { Paragraph, TextRun } from "docx";
import { getBlockChildren } from "../../../../wordExport/getBlockChildren";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { Tag } from "../../../core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";
import { buildListWrapperTable, separatorParaAfterTable } from "./listWrapperHelpers";
import { LIST_LEFT_INDENT_MM, mmToTw, IMG_WIDTH_COEFF } from "@ext/wordExport/lists/consts";
import { calcWrapperMetrics } from "@ext/wordExport/lists/listMetrics";

const calcMaxPictureWidth = (availableTw: number, leftIndentTw: number): number =>
	Math.floor(Math.max(availableTw - leftIndentTw, mmToTw(10)) / IMG_WIDTH_COEFF);

const isOfType = (childName: string, types: string[]): boolean => {
	if (!childName) return false;
	return types.includes(childName.toLowerCase());
};

export const listItemWordLayout: WordBlockChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const blockLayouts = getBlockChildren();
	const listElements = [];
	let paragraph = [];
	const children = "children" in tag ? tag.children : tag.content;

	let numberConsumed = false;

	const { numbering, ...restAddOptions } = addOptions;
	const level = numbering?.level ?? 0;
	const metrics = calcWrapperMetrics({
		level,
		availableTw: restAddOptions?.maxTableWidth,
	});

	const contentIndentTw = mmToTw(LIST_LEFT_INDENT_MM(level));
	const availableTw = restAddOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH;
	const maxPictureWidth = calcMaxPictureWidth(availableTw, contentIndentTw);

	const flushParagraph = () => {
		if (paragraph.length === 0) return;

		const isFirstParaOfItem = !numberConsumed;

		const paraOpts: any = {
			children: paragraph.flat(),
			...restAddOptions,
		};

		if (isFirstParaOfItem && numbering) {
			paraOpts.numbering = numbering;
		} else {
			paraOpts.style = WordFontStyles.listParagraph;
			paraOpts.indent = { left: contentIndentTw };
		}

		listElements.push(new Paragraph(paraOpts));
		numberConsumed = true;
		paragraph = [];
	};

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (!child || typeof child === "string") continue;

		const childName = "name" in child ? child.name : child.type;

		if (childName === "p") {
			const inlineElements = await state.renderInline(child);

			const isLastChild = children[children.length - 1] === child;
			const nextChild = children[i + 1];
			const nextChildIsImage =
				nextChild &&
				((nextChild?.children?.[0] as Tag)?.name === "Image" ||
					(nextChild as JSONContent)?.content?.[0]?.type === "Image");

			const nextChildIsBlockOrParagraph =
				!nextChild ||
				(!blockLayouts[nextChild?.name] && !blockLayouts[nextChild?.type]) ||
				nextChild?.name === "p" ||
				nextChild?.type === "p";

			const shouldAddLineBreak =
				inlineElements &&
				children.length > 1 &&
				!isLastChild &&
				!nextChildIsImage &&
				nextChildIsBlockOrParagraph;

			paragraph.push([
				...inlineElements.flat().filter(Boolean),
				...(shouldAddLineBreak ? [new TextRun({ break: 1 })] : []),
			]);
			continue;
		}

		if (childName === "Image") {
			if (paragraph.length > 0) flushParagraph();

			if (!numberConsumed && numbering) {
				listElements.push(
					new Paragraph({
						children: [new TextRun("")],
						numbering,
						spacing: { after: 0 },
						keepNext: true,
					}),
				);
				numberConsumed = true;
			}

			const figure = await imageWordLayout(
				child,
				{
					...restAddOptions,
					maxPictureWidth,
					indent: contentIndentTw,
				},
				wordRenderContext.parserContext,
			);
			listElements.push(...(Array.isArray(figure) ? figure : [figure]));
			continue;
		}

		if (paragraph.length > 0) flushParagraph();

		if (isOfType(childName, ["table", "fence", "note"])) {
			if (!numberConsumed) {
				//if first block of list item use 1x2 table wrapper
				const inner = await state.renderBlock(child, {
					...restAddOptions,
					insideTableWrapper: true,
					maxTableWidth: metrics.rightCellWidth,
					indent: 0, //only wrapper needs indent
				});

				const wrapper = buildListWrapperTable(
					inner,
					{
						reference: numbering?.reference || "",
						level: numbering?.level ?? 0,
						instance: numbering?.instance,
					},
					metrics,
				);
				listElements.push(wrapper, separatorParaAfterTable());
				numberConsumed = true;
			} else {
				const inner = await state.renderBlock(child, {
					...restAddOptions,
					indent: contentIndentTw,
				});
				listElements.push(...(Array.isArray(inner) ? inner : [inner]));
			}
			continue;
		}

		const rendered = await state.renderBlock(child, { ...restAddOptions, indent: contentIndentTw });
		if (!numberConsumed && numbering) {
			listElements.push(
				new Paragraph({
					children: [new TextRun("")],
					numbering,
					spacing: { after: 0 },
					keepNext: true,
				}),
			);
			numberConsumed = true;
		}
		listElements.push(...(Array.isArray(rendered) ? rendered : [rendered]));
	}

	if (paragraph.length > 0) flushParagraph();

	return listElements;
};
