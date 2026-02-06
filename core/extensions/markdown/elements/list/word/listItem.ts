import docx from "@dynamicImports/docx";
import { imageWordLayout } from "@ext/markdown/elements/image/word/image";
import { getMmToTw, IMG_WIDTH_COEFF, LIST_LEFT_INDENT_MM } from "@ext/wordExport/lists/consts";
import { STANDARD_PAGE_WIDTH, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { wrapWithListContinuationBookmark } from "@ext/wordExport/utils/listContinuation";
import type { JSONContent } from "@tiptap/core";
import { getBlockChildren } from "../../../../wordExport/getBlockChildren";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import type { Tag } from "../../../core/render/logic/Markdoc";

const calcMaxPictureWidth = async (availableTw: number, leftIndentTw: number) =>
	Math.floor(Math.max(availableTw - leftIndentTw, (await getMmToTw())(10)) / IMG_WIDTH_COEFF);

const isOfType = (childName: string, types: string[]): boolean => {
	if (!childName) return false;
	return types.includes(childName.toLowerCase());
};

export const listItemWordLayout: WordBlockChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const { Paragraph, TextRun } = await docx();
	const blockLayouts = getBlockChildren();
	const listElements = [];
	let paragraph = [];
	const children = "children" in tag ? tag.children : tag.content;

	let numberConsumed = false;

	const { numbering, ...restAddOptions } = addOptions;
	const level = numbering?.level ?? 0;
	const contentIndentTw = (await getMmToTw())(LIST_LEFT_INDENT_MM(level));
	const availableTw = restAddOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH;
	const maxPictureWidth = await calcMaxPictureWidth(availableTw, contentIndentTw);

	const ensureNumberingParagraph = () => {
		if (numberConsumed || !numbering) return;
		listElements.push(
			new Paragraph({
				children: [new TextRun("")],
				numbering,
				spacing: { after: 0 },
				keepNext: true,
				style: WordFontStyles.listParagraph,
			}),
		);
		numberConsumed = true;
	};

	const continuationOptions = {
		...restAddOptions,
		style: WordFontStyles.listParagraph,
		listContinuationLevel: level,
	};

	const wrapIfContinuation = async (nodes: any[], shouldWrap: boolean) => {
		if (!shouldWrap) return nodes;
		const wrapped = await wrapWithListContinuationBookmark(nodes, level);
		return wrapped;
	};

	const flushParagraph = async () => {
		if (paragraph.length === 0) return;

		const isFirstParaOfItem = !numberConsumed;

		const paraOpts: any = {
			children: paragraph.flat(),
			...continuationOptions,
		};

		if (isFirstParaOfItem && numbering) {
			paraOpts.numbering = numbering;
		} else {
			paraOpts.indent = { left: contentIndentTw };
		}

		const para = new Paragraph(paraOpts);
		const shouldWrap = !paraOpts.numbering;
		const wrapped = await wrapIfContinuation([para], shouldWrap);
		listElements.push(...wrapped);
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
			if (paragraph.length > 0) await flushParagraph();

			ensureNumberingParagraph();

			const figure = await imageWordLayout(
				child,
				{
					...restAddOptions,
					listContinuation: true,
					listContinuationLevel: level,
					maxPictureWidth,
					indent: contentIndentTw,
				},
				wordRenderContext.parserContext,
				wordRenderContext.resourceManager,
			);
			listElements.push(...(Array.isArray(figure) ? figure : [figure]));
			continue;
		}

		if (paragraph.length > 0) await flushParagraph();

		if (isOfType(childName, ["table", "fence", "note", "tabs"])) {
			if (!numberConsumed) {
				ensureNumberingParagraph();
			}
			const inner = await state.renderBlock(child, {
				...continuationOptions,
				listContinuation: true,
				indent: contentIndentTw,
			});
			listElements.push(...(Array.isArray(inner) ? inner : [inner]));
			continue;
		}

		const rendered = await state.renderBlock(child, {
			...continuationOptions,
			indent: contentIndentTw,
		});
		ensureNumberingParagraph();
		listElements.push(...(Array.isArray(rendered) ? rendered : [rendered]));
	}

	if (paragraph.length > 0) await flushParagraph();

	return listElements;
};
