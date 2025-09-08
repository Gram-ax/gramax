import t from "@ext/localization/locale/translate";
import { extractNameAndAnchor } from "@ext/markdown/elements/link/word/link";
import { ViewRenderData, ViewRenderGroup } from "@ext/properties/models";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import {
	WordBlockType,
	wordBordersType,
	WordFontStyles,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import { Table, TableRow, TableCell, Paragraph, TextRun, InternalHyperlink } from "docx";

export const getTableWithoutGrouping = (data: ViewRenderGroup[], titlesMap: Map<string, TitleInfo>): Table => {
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

	data[0].articles.forEach((article) => {
		const articleContent = getViewArticleItem(article, titlesMap);

		const articleCell = new TableCell({
			children: [articleContent],
		});

		rows.push(
			new TableRow({
				children: [articleCell],
			}),
		);
	});

	return new Table({
		rows: rows,
		margins: wordMarginsType[WordBlockType.table],
		borders: wordBordersType[WordBlockType.table],
	});
};

export const getTableWithGrouping = (
	data: ViewRenderGroup[],
	titlesMap: Map<string, TitleInfo>,
	groupby: string[],
): Table => {
	const headers = createTableHeaders(groupby);

	const body = createTableBody(data, titlesMap);

	body.unshift(headers);

	return new Table({
		rows: body,
		margins: wordMarginsType[WordBlockType.table],
		borders: wordBordersType[WordBlockType.table],
	});
};

const createTableBody = (data: ViewRenderGroup[], titlesMap: Map<string, TitleInfo>): TableRow[] => {
	return data.flatMap((group) => processGroupForTable(group, titlesMap, group.group || []));
};

const processGroupForTable = (
	group: ViewRenderGroup,
	titlesMap: Map<string, TitleInfo>,
	currentGroupValues: (string | null)[] = [],
): TableRow[] => {
	const rows: TableRow[] = [];

	if (group.articles?.length > 0) {
		group.articles.forEach((article, articleIndex) => {
			const articleItem = getViewArticleItem(article, titlesMap);
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
				.filter((cell) => cell !== null) as TableCell[];

			newRowCells.push(
				new TableCell({
					children: [articleItem],
				}),
			);

			rows.push(
				new TableRow({
					children: newRowCells,
				}),
			);
		});
	}

	if (group.subgroups?.length > 0) {
		group.subgroups.forEach((subgroup) => {
			const subgroupValues = [...currentGroupValues, ...(subgroup.group || [])];
			rows.push(...processGroupForTable(subgroup, titlesMap, subgroupValues));
		});
	}

	return rows;
};

const createTableHeaders = (groupby: string[]): TableRow => {
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

export const getViewArticleItem = (article: ViewRenderData, titlesMap: Map<string, TitleInfo>): Paragraph => {
	const { title, order, anchor } = extractNameAndAnchor(
		{ href: article.linkPath, hash: "" },
		titlesMap,
	);
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
