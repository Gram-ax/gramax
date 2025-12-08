import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";
import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import {
	STANDARD_PAGE_WIDTH,
	WordBlockType,
	getWordBordersType,
	WordFontStyles,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { createParagraph } from "@ext/wordExport/createParagraph";
import docx from "@dynamicImports/docx";
import { markTableAsListContinuation } from "@ext/wordExport/utils/listContinuation";

const INNER_BLOCK_WIDTH_DIFFERENCE = 310;

export const tabsWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const { Table, TableCell, TableRow, WidthType, ImportedXmlComponent } = await docx();
	const wordBordersType = await getWordBordersType();
	const tabs = "children" in tag ? tag.children : tag.content;

	const rows: InstanceType<typeof TableRow>[] = [];

	for (const tab of tabs as Array<Tag | JSONContent>) {
		const tabTag = tab as any;
		const attrs = "attributes" in tabTag ? tabTag.attributes : tabTag.attrs;
		const tabChildren = "children" in tabTag ? tabTag.children : tabTag.content;

		const titleParagraph = await createParagraph(
			[await createContent(attrs?.name, addOptions)],
			WordFontStyles.tabsTitle,
		);
		rows.push(
			new TableRow({
				children: [
					new TableCell({
						children: [titleParagraph],
						width: { size: STANDARD_PAGE_WIDTH, type: WidthType.DXA },
					}),
				],
			}),
		);

		const contentChildren = (
			await Promise.all(
				(tabChildren ?? []).map((child: Tag) =>
					state.renderBlock(child, {
						...addOptions,
						maxTableWidth:
							(addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH) - INNER_BLOCK_WIDTH_DIFFERENCE,
					}),
				),
			)
		).flat();

		rows.push(
			new TableRow({
				children: [
					new TableCell({
						children: contentChildren,
						width: { size: STANDARD_PAGE_WIDTH, type: WidthType.DXA },
					}),
				],
			}),
		);
	}

	const table = new Table({
		rows,
		width: { size: addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH, type: WidthType.DXA },
		borders: wordBordersType[WordBlockType.tabs],
		margins: wordMarginsType[WordBlockType.tabs],
		style: WordBlockType.tabs,
	});

	disableTableHeaderLook(table, ImportedXmlComponent);

	if (addOptions?.listContinuation) {
		await markTableAsListContinuation(table, addOptions.listContinuationLevel);
	}

	return [table];
};

const disableTableHeaderLook = (table: any, ImportedXmlComponent: any) => {
	// Override table look so Word does not treat the first row/column as headers.
	if (!ImportedXmlComponent) return;

	const xml = `
	  <w:tblLook
		w:firstRow="0"
		w:lastRow="0"
		w:firstColumn="0"
		w:lastColumn="0"
		w:noHBand="1"
		w:noVBand="1"/>`;

	const importedComp = ImportedXmlComponent.fromXmlString(xml);
	const tblLookComp = importedComp?.root?.[0];
	if (!tblLookComp) return;

	const rootArray = table?.root;
	if (!Array.isArray(rootArray)) return;

	let tblPrComp = rootArray.find((c: any) => c?.rootKey === "w:tblPr");

	if (!tblPrComp) {
		tblPrComp = new ImportedXmlComponent("w:tblPr");
		rootArray.unshift(tblPrComp);
	}

	const tblPrRoot = tblPrComp?.root;
	if (Array.isArray(tblPrRoot)) {
		for (let i = tblPrRoot.length - 1; i >= 0; i--) {
			if (tblPrRoot[i]?.rootKey === "w:tblLook") {
				tblPrRoot.splice(i, 1);
			}
		}
	}

	tblPrComp?.root.push(tblLookComp);
};
