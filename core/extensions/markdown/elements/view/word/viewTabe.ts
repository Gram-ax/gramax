import t from "@ext/localization/locale/translate";
import { extractNameAndAnchor } from "@ext/markdown/elements/link/word/link";
import { ViewRenderData, ViewRenderGroup } from "@ext/properties/models";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import {
	WordBlockType,
	getWordBordersType,
	WordFontStyles,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import docx from "@dynamicImports/docx";
import type { TableRow, TableCell } from "docx";

export const getTableWithoutGrouping = async (data: ViewRenderGroup[], titlesMap: Map<string, TitleInfo>) => {
	const { Table, TableRow, TableCell, Paragraph, TextRun } = await docx();
	const wordBordersType = await getWordBordersType();
	const rows: TableRow[] = [];

	const headerCell = new TableCell({
		children: [
			new Paragraph({
				children: [
					new TextRun({
						text: t("article2"),
						style: WordFontStyles.tableTitle,
					}),
				],
			}),
		],
	});

	rows.push(
		new TableRow({
			children: [headerCell],
		}),
	);

	await data[0].articles.forEachAsync(async (article) => {
		const articleContent = await getViewArticleItem(article, titlesMap);
		const articleCell = new TableCell({ children: [articleContent] });
		rows.push(new TableRow({ children: [articleCell] }));
	});

	return new Table({
		rows: rows,
		margins: wordMarginsType[WordBlockType.table],
		borders: wordBordersType[WordBlockType.table],
	});
};

export const getTableWithGrouping = async (
	data: ViewRenderGroup[],
	titlesMap: Map<string, TitleInfo>,
	groupby: string[],
) => {
	const { Table } = await docx();
	const wordBordersType = await getWordBordersType();
	const headers = await createTableHeaders(groupby);

	const body = await createTableBody(data, titlesMap);

	body.unshift(headers);

	return new Table({
		rows: body,
		margins: wordMarginsType[WordBlockType.table],
		borders: wordBordersType[WordBlockType.table],
	});
};

const createTableBody = async (data: ViewRenderGroup[], titlesMap: Map<string, TitleInfo>) => {
	const rows = await data.mapAsync((group) => processGroupForTable(group, titlesMap, group.group || []));
	return rows.flat();
};

const processGroupForTable = async (
	group: ViewRenderGroup,
	titlesMap: Map<string, TitleInfo>,
	currentGroupValues: (string | null)[] = [],
) => {
	const { TableRow, TableCell, Paragraph, TextRun } = await docx();
	const rows: TableRow[] = [];

	if (group.articles?.length > 0) {
		await group.articles.forEachAsync(async (article, articleIndex) => {
			const articleItem = await getViewArticleItem(article, titlesMap);
			const rowValues: (string | null)[] = [...currentGroupValues];

			const newRowCells: TableCell[] = rowValues
				.map((value, index) => {
					if (articleIndex > 0 && rowValues[index] === currentGroupValues[index]) {
						return null;
					} else {
						return new TableCell({
							children: [
								new Paragraph({
									children: [new TextRun({ text: value || "", style: WordFontStyles.normal })],
								}),
							],
							rowSpan: group.articles.length,
						});
					}
				})
				.filter((cell) => cell !== null);

			newRowCells.push(new TableCell({ children: [articleItem] }));

			rows.push(new TableRow({ children: newRowCells }));
		});
	}

	if (group.subgroups?.length > 0) {
		await group.subgroups.forEachAsync(async (subgroup) => {
			const subgroupValues = [...currentGroupValues, ...(subgroup.group || [])];
			rows.push(...(await processGroupForTable(subgroup, titlesMap, subgroupValues)));
		});
	}

	return rows;
};

const createTableHeaders = async (groupby: string[]) => {
	const { TableRow, TableCell, Paragraph, TextRun } = await docx();
	const headerCells = groupby.map((key) => {
		return new TableCell({
			children: [
				new Paragraph({
					children: [
						new TextRun({
							text: key,
							style: WordFontStyles.tableTitle,
						}),
					],
				}),
			],
		});
	});

	headerCells.push(
		new TableCell({
			children: [
				new Paragraph({
					children: [
						new TextRun({
							text: t("article2"),
							style: WordFontStyles.tableTitle,
						}),
					],
				}),
			],
		}),
	);

	return new TableRow({
		children: headerCells,
	});
};

export const getViewArticleItem = async (article: ViewRenderData, titlesMap: Map<string, TitleInfo>) => {
	const { Paragraph, TextRun, InternalHyperlink } = await docx();
	const { title, order, anchor } = extractNameAndAnchor({ href: article.linkPath, hash: "" }, titlesMap);
	const safeTitle = article.title ? article.title : t("article.no-name");
	const linkToDestination = title ? generateBookmarkName(order, title, anchor) : undefined;

	const paragraph = new Paragraph({
		children: [
			linkToDestination
				? new InternalHyperlink({
						anchor: linkToDestination,
						children: [
							new TextRun({
								text: safeTitle,
								style: WordFontStyles.link,
							}),
						],
				  })
				: new TextRun({
						text: safeTitle,
						style: WordFontStyles.normal,
				  }),
		],
	});

	return paragraph;
};
