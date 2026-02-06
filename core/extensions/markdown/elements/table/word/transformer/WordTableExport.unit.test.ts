import type { WordSerializerState } from "@ext/wordExport/WordExportState";
import { WordTableExport } from "./WordTableExport";

jest.mock("@dynamicImports/docx", () => {
	const mockDocxModule = {
		Table: class MockTable {
			options: any;
			constructor(options: any) {
				this.options = options;
			}
		},
		TableRow: class MockTableRow {
			options: any;
			constructor(options: any) {
				this.options = options;
			}
		},
		TableCell: class MockTableCell {
			options: any;
			constructor(options: any) {
				this.options = options;
			}
		},
		Paragraph: class MockParagraph {},
		TextRun: class MockTextRun {},
		WidthType: { DXA: "DXA" },
		BorderStyle: { NIL: "NIL", SINGLE: "SINGLE" },
		ImportedXmlComponent: class MockImportedXmlComponent {
			rootKey: string;
			root: any[];

			constructor(rootKey: string) {
				this.rootKey = rootKey;
				this.root = [];
			}

			static fromXmlString(xml: string) {
				const mockComponent = new MockImportedXmlComponent("w:tblLook");

				const firstRow = xml.includes('w:firstRow="1"') ? 1 : 0;
				const lastRow = xml.includes('w:lastRow="1"') ? 1 : 0;
				const firstColumn = xml.includes('w:firstColumn="1"') ? 1 : 0;
				const lastColumn = xml.includes('w:lastColumn="1"') ? 1 : 0;
				const noHBand = xml.includes('w:noHBand="0"') ? 0 : 1;
				const noVBand = xml.includes('w:noVBand="0"') ? 0 : 1;

				mockComponent.root = [
					{
						rootKey: "w:tblLook",
						attributes: {
							"w:firstRow": firstRow,
							"w:lastRow": lastRow,
							"w:firstColumn": firstColumn,
							"w:lastColumn": lastColumn,
							"w:noHBand": noHBand,
							"w:noVBand": noVBand,
						},
					},
				];

				return mockComponent;
			}
		},
	};
	const mock = jest.fn(() => Promise.resolve(mockDocxModule));
	return {
		__esModule: true,
		default: mock,
		__mockDocxModule: mockDocxModule,
	};
});

jest.mock("@ext/wordExport/options/wordExportSettings", () => {
	const mockGetBorders = jest.fn().mockResolvedValue({ Table: {} });
	const mockSettings = {
		STANDARD_PAGE_WIDTH: 9353,
		WordBlockType: { table: "Table" },
		getWordBordersType: () => mockGetBorders(),
		WordFontStyles: {
			tableTitle: "TableTitle",
			normal: "Normal",
		},
		wordMarginsType: { Table: {} },
		MAX_WIDTH: 595,
		__mockGetWordBordersType: mockGetBorders,
	};

	return mockSettings;
});

jest.mock("@ext/markdown/elements/table/edit/logic/exportUtils", () => ({
	aggregateTable: jest.fn(),
	setCellAlignment: jest.fn(),
}));

const createState = (
	renderBlock: jest.Mock<Promise<unknown[]>, unknown[]> = jest.fn().mockResolvedValue([]),
): WordSerializerState =>
	({
		renderBlock,
		renderInline: jest.fn(),
		renderBlockAsInline: jest.fn(),
	}) as unknown as WordSerializerState;

const createTableTag = () =>
	({
		name: "table",
		attributes: {},
		children: [
			{
				name: "tbody",
				attributes: {},
				children: [
					{
						name: "tr",
						attributes: {},
						children: [
							{
								name: "td",
								attributes: { colwidth: [400] },
								children: [
									{
										name: "Image",
										attributes: {},
										children: [],
									},
								],
							},
							{
								name: "td",
								attributes: { colwidth: [400] },
								children: [
									{
										name: "p",
										attributes: {},
										children: ["content"],
									},
								],
							},
						],
					},
				],
			},
		],
	}) as any;

describe("WordTableExport", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("limits image width to contracted cell width", async () => {
		const renderBlock = jest.fn().mockResolvedValue([]);
		const state = createState(renderBlock);
		const exporter = new WordTableExport(state);
		const table = createTableTag();

		const result = await exporter.renderTable(state, table, { maxTableWidth: 5000 } as any);

		const docxMockModule = jest.requireMock("@dynamicImports/docx");
		expect(result).toBeInstanceOf(docxMockModule.__mockDocxModule.Table);

		const resultOptions = result as unknown as { options: { columnWidths: number[] } };
		expect(resultOptions.options.columnWidths).toEqual([2500, 2500]);

		const imageCall = renderBlock.mock.calls.find(([node]) => node?.name === "Image");
		expect(imageCall).toBeDefined();

		const [, addOptions] = imageCall as [unknown, { maxPictureWidth: number }];
		expect(addOptions.maxPictureWidth).toBe(135);

		const settingsMock = jest.requireMock("@ext/wordExport/options/wordExportSettings");
		expect(addOptions.maxPictureWidth).toBeLessThanOrEqual(settingsMock.MAX_WIDTH);
	});
});
