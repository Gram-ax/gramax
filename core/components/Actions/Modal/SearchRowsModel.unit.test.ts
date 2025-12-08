import {
	SearchArticleResult,
	SearchCatalogResult,
	SearchResult,
	SearchResultBlockItem,
	SearchResultItem,
} from "@ext/serach/Searcher";
import Url from "../../../ui-logic/ApiServices/Types/Url";
import { buildArticleRows, RowArticleSearchResult, RowSearchResult, SearchItemBlockRow } from "./SearchRowsModel";

describe("SearchRowsModel", () => {
	it("should create search rows model for article with paragraphs", () => {
		const onLinkClick = jest.fn();
		const searchData: SearchResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			properties: [],
			breadcrumbs: [],
			isRecommended: false,
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
			},
			items: [
				{
					type: "paragraph",
					items: [
						{ type: "text", text: "...установить " },
						{ type: "highlight", text: "логотип" },
						{ type: "text", text: " можно с помощью кнопки..." },
					],
				},
			],
		};
		const result = buildArticleRows([searchData], onLinkClick);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "link",
						id: 1,
						key: undefined,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "установить логотип можно с помощью кнопки",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...установить " },
							{ type: "highlight", text: "логотип" },
							{ type: "text", text: " можно с помощью кнопки..." },
						],
						onClick: expect.any(Function),
					},
				],
				onClick: expect.any(Function),
			},
		] satisfies RowSearchResult[]);
	});

	it("should add message when there are more than N paragraphs", () => {
		const onLinkClick = jest.fn();
		const searchData: SearchResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			properties: [],
			breadcrumbs: [],
			isRecommended: false,
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
			},
			items: [
				{
					type: "paragraph",
					items: [
						{ type: "text", text: "...установить " },
						{ type: "highlight", text: "логотип" },
						{ type: "text", text: " можно с помощью кнопки..." },
					],
				},
				{
					type: "paragraph",
					items: [
						{ type: "text", text: "...сделать " },
						{ type: "highlight", text: "логотип" },
					],
				},
				{
					type: "paragraph",
					items: [
						{ type: "text", text: "...показать " },
						{ type: "highlight", text: "логотип" },
						{ type: "text", text: " в заголовке..." },
					],
				},
				{
					type: "paragraph",
					items: [
						{ type: "text", text: "...удалить " },
						{ type: "highlight", text: "логотип" },
						{ type: "text", text: " из заголовка..." },
					],
				},
			],
		};
		const result = buildArticleRows([searchData], onLinkClick);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "link",
						id: 1,
						key: undefined,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "установить логотип можно с помощью кнопки",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...установить " },
							{ type: "highlight", text: "логотип" },
							{ type: "text", text: " можно с помощью кнопки..." },
						],
						onClick: expect.any(Function),
					},
					{
						type: "link",
						id: 2,
						key: undefined,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "сделать логотип",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...сделать " },
							{ type: "highlight", text: "логотип" },
						],
						onClick: expect.any(Function),
					},
					{
						type: "link",
						id: 3,
						key: undefined,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "показать логотип в заголовке",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...показать " },
							{ type: "highlight", text: "логотип" },
							{ type: "text", text: " в заголовке..." },
						],
						onClick: expect.any(Function),
					},
					{
						type: "message",
						textContent: "...1 more",
					},
				],
				onClick: expect.any(Function),
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle correct paragraph group", () => {
		const onLinkClick = jest.fn();
		const searchData: SearchResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			properties: [],
			breadcrumbs: [],
			isRecommended: false,
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
			},
			items: [
				{
					type: "paragraph",
					items: [
						{ type: "text", text: "...установить " },
						{ type: "highlight", text: "логотип" },
						{ type: "text", text: " можно с помощью кнопки..." },
					],
				},
				{
					type: "paragraph_group",
					paragraphs: [
						{
							type: "paragraph",
							items: [{ type: "text", text: "Логотип" }],
						},
						{
							type: "paragraph",
							items: [{ type: "text", text: "Логотип" }],
						},
					],
				},
			],
		};
		const result = buildArticleRows([searchData], onLinkClick);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "link",
						id: 1,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "установить логотип можно с помощью кнопки",
								highlightFragmentIndex: "0",
							},
						}),
						key: undefined,
						marks: [
							{ type: "text", text: "...установить " },
							{ type: "highlight", text: "логотип" },
							{ type: "text", text: " можно с помощью кнопки..." },
						],
						onClick: expect.any(Function),
					},
					{
						type: "link",
						id: 2,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "Логотип",
								highlightFragmentIndex: "1",
							},
						}),
						key: undefined,
						marks: [{ type: "text", text: "Логотип" }],
						onClick: expect.any(Function),
					},
					{
						type: "link",
						id: 3,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "Логотип",
								highlightFragmentIndex: "1",
							},
						}),
						key: undefined,
						marks: [{ type: "text", text: "Логотип" }],
						onClick: expect.any(Function),
					},
				],
				onClick: expect.any(Function),
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle correct blocks", () => {
		const onLinkClick = jest.fn();
		const searchData: SearchResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			properties: [],
			breadcrumbs: [],
			isRecommended: false,
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
			},
			items: [
				{
					type: "block",
					title: [
						{ type: "text", text: "Л" },
						{ type: "highlight", text: "оготи" },
						{ type: "text", text: "п" },
					],
					items: [
						{
							type: "paragraph",
							items: [
								{ type: "text", text: "...установить " },
								{ type: "highlight", text: "логотип" },
								{ type: "text", text: " можно с помощью кнопки..." },
							],
						},
						{
							type: "paragraph_group",
							paragraphs: [
								{
									type: "paragraph",
									items: [{ type: "text", text: "Логотип" }],
								},
								{
									type: "paragraph",
									items: [{ type: "text", text: "Логотип" }],
								},
							],
						},
					],
				},
			],
		};
		const result = buildArticleRows([searchData], onLinkClick);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "block",
						id: 1,
						href: Url.from({
							pathname: "release-notes",
							query: { highlightFragment: "Логотип", highlightFragmentIndex: "0" },
						}),
						onClick: expect.any(Function),
						embeddedLinkTitle: undefined,
						hiddenText: undefined,
						breadcrumbs: [
							{
								type: "block",
								title: [
									{ type: "text", text: "Л" },
									{ type: "highlight", text: "оготи" },
									{ type: "text", text: "п" },
								],
								items: [
									{
										type: "paragraph",
										items: [
											{ type: "text", text: "...установить " },
											{ type: "highlight", text: "логотип" },
											{ type: "text", text: " можно с помощью кнопки..." },
										],
									},
									{
										type: "paragraph_group",
										paragraphs: [
											{
												type: "paragraph",
												items: [{ type: "text", text: "Логотип" }],
											},
											{
												type: "paragraph",
												items: [{ type: "text", text: "Логотип" }],
											},
										],
									},
								],
							},
						],
						children: [
							{
								type: "link",
								id: 2,
								href: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "установить логотип можно с помощью кнопки",
										highlightFragmentIndex: "0",
									},
								}),
								key: undefined,
								marks: [
									{ type: "text", text: "...установить " },
									{ type: "highlight", text: "логотип" },
									{ type: "text", text: " можно с помощью кнопки..." },
								],
								onClick: expect.any(Function),
							},
							{
								type: "link",
								id: 3,
								href: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "Логотип",
										highlightFragmentIndex: "2",
									},
								}),
								key: undefined,
								marks: [{ type: "text", text: "Логотип" }],
								onClick: expect.any(Function),
							},
							{
								type: "link",
								id: 4,
								href: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "Логотип",
										highlightFragmentIndex: "2",
									},
								}),
								key: undefined,
								marks: [{ type: "text", text: "Логотип" }],
								onClick: expect.any(Function),
							},
						],
					},
				],
				onClick: expect.any(Function),
			},
		] satisfies RowSearchResult[]);
	});

	it("should add message in block when there are more than N paragraphs before block", () => {
		const onLinkClick = jest.fn();
		const paragraphs: SearchResultItem[] = [
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...установить " },
					{ type: "highlight", text: "логотип" },
					{ type: "text", text: " можно с помощью кнопки..." },
				],
			},
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...сделать " },
					{ type: "highlight", text: "логотип" },
				],
			},
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...показать " },
					{ type: "highlight", text: "логотип" },
					{ type: "text", text: " в заголовке..." },
				],
			},
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...удалить " },
					{ type: "highlight", text: "логотип" },
					{ type: "text", text: " из заголовка..." },
				],
			},
		];
		const searchData: SearchResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			properties: [],
			breadcrumbs: [],
			isRecommended: false,
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
			},
			items: [
				...paragraphs,
				{
					type: "block",
					title: [
						{ type: "text", text: "Л" },
						{ type: "highlight", text: "оготи" },
						{ type: "text", text: "п" },
					],
					items: [],
				},
			],
		};
		const result = buildArticleRows([searchData], onLinkClick);

		expect((result.rows[0] as RowArticleSearchResult).items.length).toEqual(4);
		expect(((result.rows[0] as RowArticleSearchResult).items[3] as SearchItemBlockRow).hiddenText).toEqual(
			"...1 more",
		);
	});

	it("should set correct link for element link", () => {
		const onLinkClick = jest.fn();
		const paragraphs: SearchResultItem[] = [
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...установить " },
					{ type: "highlight", text: "логотип" },
					{ type: "text", text: " можно с помощью кнопки..." },
				],
			},
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...сделать " },
					{ type: "highlight", text: "логотип" },
				],
			},
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...показать " },
					{ type: "highlight", text: "логотип" },
					{ type: "text", text: " в заголовке..." },
				],
			},
			{
				type: "paragraph",
				items: [
					{ type: "text", text: "...удалить " },
					{ type: "highlight", text: "логотип" },
					{ type: "text", text: " из заголовка..." },
				],
			},
		];
		const searchData: SearchResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			properties: [],
			breadcrumbs: [],
			isRecommended: false,
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
			},
			items: [
				...paragraphs,
				{
					type: "block",
					title: [
						{ type: "text", text: "Л" },
						{ type: "highlight", text: "оготи" },
						{ type: "text", text: "п" },
					],
					items: [],
				},
			],
		};
		const { rowIdLinkMap } = buildArticleRows([searchData], onLinkClick);

		expect(rowIdLinkMap.size).toEqual(5);
		expect(rowIdLinkMap.get(0).url).toEqual(Url.from({ pathname: "release-notes" }));
		expect(rowIdLinkMap.get(1).url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "установить логотип можно с помощью кнопки", highlightFragmentIndex: "0" },
			}),
		);
		expect(rowIdLinkMap.get(2).url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "сделать логотип", highlightFragmentIndex: "0" },
			}),
		);
		expect(rowIdLinkMap.get(3).url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "показать логотип в заголовке", highlightFragmentIndex: "0" },
			}),
		);
		expect(rowIdLinkMap.get(4).url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "Логотип", highlightFragmentIndex: "4" },
			}),
		);
	});

	it("should create search rows model for catalog", () => {
		const onLinkClick = jest.fn();
		const searchData: [SearchArticleResult, SearchCatalogResult] = [
			{
				type: "article",
				url: "release-notes",
				title: [
					{
						type: "text",
						text: "Release Notes",
					},
				],
				properties: [],
				breadcrumbs: [],
				isRecommended: false,
				catalog: {
					name: "Gramax",
					title: "Gramax Docs",
				},
				items: [
					{
						type: "paragraph",
						items: [
							{ type: "text", text: "...установить " },
							{ type: "highlight", text: "логотип" },
							{ type: "text", text: " можно с помощью кнопки..." },
						],
					},
				],
			},
			{
				type: "catalog",
				name: "cat",
				title: [
					{
						type: "text",
						text: "catt",
					},
					{
						type: "highlight",
						text: "cathl",
					},
					{
						type: "text",
						text: "catt2",
					},
					{
						type: "text",
						text: "catt3",
					},
				],
				url: "caturl",
			},
		];
		const result = buildArticleRows(searchData, onLinkClick);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData[0],
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "link",
						id: 1,
						key: undefined,
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "установить логотип можно с помощью кнопки",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...установить " },
							{ type: "highlight", text: "логотип" },
							{ type: "text", text: " можно с помощью кнопки..." },
						],
						onClick: expect.any(Function),
					},
				],
				onClick: expect.any(Function),
			},
			{
				type: "catalog",
				rawResult: searchData[1],
				id: 2,
				href: Url.from({ pathname: "caturl" }),
				onClick: expect.any(Function),
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle paragraphs and blocks inside block with embedded link title", () => {
		const onLinkClick = jest.fn();
		const searchData: SearchResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			properties: [],
			breadcrumbs: [],
			isRecommended: false,
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
			},
			items: [
				{
					type: "block",
					title: [
						{
							type: "text",
							text: "Фрагмент с файлом",
						},
					],
					embeddedLinkTitle: [
						{
							type: "text",
							text: "Какой-то файл",
						},
					],
					items: [
						{
							type: "paragraph",
							items: [
								{ type: "text", text: "...установить " },
								{ type: "highlight", text: "логотип" },
								{ type: "text", text: " можно с помощью кнопки..." },
							],
						},
						{
							type: "block",
							title: [
								{
									type: "text",
									text: "Блок внутри файла",
								},
							],
							items: [
								{
									type: "paragraph",
									items: [{ type: "text", text: "Контент" }],
								},
							],
						},
					],
				},
			],
		};
		const result = buildArticleRows([searchData], onLinkClick);
		// (result as any).rows[0].items[0].children[1].breadcrumbs; // ?
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "block",
						embeddedLinkTitle: [
							{
								type: "text",
								text: "Какой-то файл",
							},
						],
						id: 1,
						onClick: expect.any(Function),
						href: Url.from({
							pathname: "release-notes",
							query: { highlightFragment: "Фрагмент с файлом", highlightFragmentIndex: "0" },
						}),
						breadcrumbs: searchData.items as SearchResultBlockItem[],
						children: [
							{
								type: "link",
								key: expect.any(String),
								id: undefined,
								href: Url.from({
									pathname: "release-notes",
									query: { highlightFragment: "Фрагмент с файлом", highlightFragmentIndex: "0" },
								}),
								marks: [
									{ type: "text", text: "...установить " },
									{ type: "highlight", text: "логотип" },
									{ type: "text", text: " можно с помощью кнопки..." },
								],
								onClick: expect.any(Function),
							},
							{
								type: "block",
								breadcrumbs: [
									(searchData.items[0] as SearchResultBlockItem).items[1],
								] as SearchResultBlockItem[],
								children: [
									{
										type: "link",
										key: expect.any(String),
										id: undefined,
										href: Url.from({
											pathname: "release-notes",
											query: {
												highlightFragment: "Фрагмент с файлом",
												highlightFragmentIndex: "0",
											},
										}),
										marks: [{ type: "text", text: "Контент" }],
										onClick: expect.any(Function),
									},
								],
								key: expect.any(String),
								onClick: expect.any(Function),
								href: Url.from({
									pathname: "release-notes",
									query: { highlightFragment: "Фрагмент с файлом", highlightFragmentIndex: "0" },
								}),
							},
						],
					},
				],
				onClick: expect.any(Function),
			},
		] satisfies RowSearchResult[]);
	});
});
