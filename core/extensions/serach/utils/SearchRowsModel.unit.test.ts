import Url from "@core-ui/ApiServices/Types/Url";
import {
	SearchArticleResult,
	SearchCatalogResult,
	SearchResult,
	SearchResultBlockItem,
	SearchResultItem,
} from "@ext/serach/Searcher";
import {
	buildArticleRows,
	RowArticleSearchResult,
	RowSearchResult,
	SearchItemMessageRow,
} from "@ext/serach/utils/SearchRowsModel";

describe("SearchRowsModel", () => {
	it("should create search rows model for article with paragraphs", () => {
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
				url: "gramax-docs",
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
		const result = buildArticleRows([searchData]);
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "установить логотип можно с помощью кнопки",
									indexInArticle: 0,
								},
							},
						},
					},
				],
				openSideEffect: {
					params: {
						url: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should add message when there are more than N paragraphs", () => {
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
				url: "gramax-docs",
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
		const result = buildArticleRows([searchData]);
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "установить логотип можно с помощью кнопки",
									indexInArticle: 0,
								},
							},
						},
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "сделать логотип",
									indexInArticle: 0,
								},
							},
						},
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "показать логотип в заголовке",
									indexInArticle: 0,
								},
							},
						},
					},
					{
						type: "message",
						textContent: "...1 more",
					},
				],
				openSideEffect: {
					params: {
						url: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle correct paragraph group", () => {
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
				url: "gramax-docs",
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
		const result = buildArticleRows([searchData]);
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "установить логотип можно с помощью кнопки",
									indexInArticle: 0,
								},
							},
						},
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "Логотип",
									indexInArticle: 1,
								},
							},
						},
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "Логотип",
									indexInArticle: 1,
								},
							},
						},
					},
				],
				openSideEffect: {
					params: {
						url: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle correct blocks", () => {
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
				url: "gramax-docs",
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
		const result = buildArticleRows([searchData]);
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "Логотип",
									indexInArticle: 0,
								},
							},
						},
						breadcrumbs: [
							{
								type: "header",
								title: [
									{ type: "text", text: "Л" },
									{ type: "highlight", text: "оготи" },
									{ type: "text", text: "п" },
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
								openSideEffect: {
									params: {
										url: "release-notes",
										fragmentInfo: {
											text: "установить логотип можно с помощью кнопки",
											indexInArticle: 0,
										},
									},
								},
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
								openSideEffect: {
									params: {
										url: "release-notes",
										fragmentInfo: {
											text: "Логотип",
											indexInArticle: 2,
										},
									},
								},
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
								openSideEffect: {
									params: {
										url: "release-notes",
										fragmentInfo: {
											text: "Логотип",
											indexInArticle: 2,
										},
									},
								},
							},
						],
					},
				],
				openSideEffect: {
					params: {
						url: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should add message row when there are more than N paragraphs before block", () => {
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
				url: "gramax-docs",
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
		const result = buildArticleRows([searchData]);

		expect((result.rows[0] as RowArticleSearchResult).items.length).toEqual(5);
		expect(((result.rows[0] as RowArticleSearchResult).items[3] as SearchItemMessageRow).textContent).toEqual(
			"...1 more",
		);
	});

	it("should set correct link for element link", () => {
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
				url: "gramax-docs",
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
		const { rowIdLinkMap } = buildArticleRows([searchData]);

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
					url: "gramax-docs",
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
		const result = buildArticleRows(searchData);
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
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "установить логотип можно с помощью кнопки",
									indexInArticle: 0,
								},
							},
						},
					},
				],
				openSideEffect: {
					params: {
						url: "release-notes",
					},
				},
			},
			{
				type: "catalog",
				rawResult: searchData[1],
				id: 2,
				href: Url.from({ pathname: "caturl" }),
				openSideEffect: {
					params: {
						url: "caturl",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle paragraphs and blocks inside block with embedded link title", () => {
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
				url: "gramax-docs",
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
		const result = buildArticleRows([searchData]);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "file-block",
						id: 1,
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "Фрагмент с файлом",
									indexInArticle: 0,
								},
							},
						},
						href: Url.from({
							pathname: "release-notes",
							query: { highlightFragment: "Фрагмент с файлом", highlightFragmentIndex: "0" },
						}),
						breadcrumbs: [
							{
								type: "file",
								title: (searchData.items[0] as SearchResultBlockItem).title,
								fileName: [
									{
										type: "text",
										text: "Какой-то файл",
									},
								],
							},
						],
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
								openSideEffect: {
									params: {
										url: "release-notes",
										fragmentInfo: {
											text: "Фрагмент с файлом",
											indexInArticle: 0,
										},
									},
								},
							},
							{
								type: "block",
								breadcrumbs: [
									{
										type: "header",
										title: [
											{
												type: "text",
												text: "Блок внутри файла",
											},
										],
									},
								],
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
										openSideEffect: {
											params: {
												url: "release-notes",
												fragmentInfo: {
													text: "Фрагмент с файлом",
													indexInArticle: 0,
												},
											},
										},
									},
								],
								key: expect.any(String),
								openSideEffect: {
									params: {
										url: "release-notes",
										fragmentInfo: {
											text: "Фрагмент с файлом",
											indexInArticle: 0,
										},
									},
								},
								href: Url.from({
									pathname: "release-notes",
									query: { highlightFragment: "Фрагмент с файлом", highlightFragmentIndex: "0" },
								}),
							},
						],
					},
				],
				openSideEffect: {
					params: {
						url: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle breadcrumbs with file", () => {
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
				url: "gramax-docs",
			},
			items: [
				{
					type: "block",
					title: [
						{
							type: "text",
							text: "Глава с ",
						},
						{
							type: "highlight",
							text: "файлом",
						},
					],
					items: [
						{
							type: "block",
							title: [
								{
									type: "text",
									text: "Это текст к которому прикреплен ",
								},
								{
									type: "highlight",
									text: "файл",
								},
							],
							embeddedLinkTitle: [
								{
									type: "text",
									text: "Это ",
								},
								{
									type: "highlight",
									text: "название",
								},
								{
									type: "text",
									text: " самого файла.pdf",
								},
							],
							items: [
								{
									type: "block",
									title: [
										{
											type: "text",
											text: "Это глава ",
										},
										{
											type: "highlight",
											text: "внутри файла",
										},
									],
									items: [
										{
											type: "paragraph",
											items: [
												{
													type: "highlight",
													text: "Это уже сам",
												},
												{
													type: "text",
													text: " абзац",
												},
											],
										},
									],
								},
							],
						},
					],
				},
			],
		};
		const result = buildArticleRows([searchData]);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: 0,
				href: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "file-block",
						id: 1,
						openSideEffect: {
							params: {
								url: "release-notes",
								fragmentInfo: {
									text: "Это текст к которому прикреплен файл",
									indexInArticle: 0,
								},
							},
						},
						href: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "Это текст к которому прикреплен файл",
								highlightFragmentIndex: "0",
							},
						}),
						breadcrumbs: [
							{
								type: "header",
								title: [
									{
										type: "text",
										text: "Глава с ",
									},
									{
										type: "highlight",
										text: "файлом",
									},
								],
							},
							{
								type: "file",
								title: [
									{
										type: "text",
										text: "Это текст к которому прикреплен ",
									},
									{
										type: "highlight",
										text: "файл",
									},
								],
								fileName: [
									{
										type: "text",
										text: "Это ",
									},
									{
										type: "highlight",
										text: "название",
									},
									{
										type: "text",
										text: " самого файла.pdf",
									},
								],
							},
							{
								type: "header",
								title: [
									{
										type: "text",
										text: "Это глава ",
									},
									{
										type: "highlight",
										text: "внутри файла",
									},
								],
							},
						],
						children: [
							{
								type: "link",
								key: expect.any(String),
								id: undefined,
								href: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "Это текст к которому прикреплен файл",
										highlightFragmentIndex: "0",
									},
								}),
								marks: [
									{ type: "highlight", text: "Это уже сам" },
									{ type: "text", text: " абзац" },
								],
								openSideEffect: {
									params: {
										url: "release-notes",
										fragmentInfo: {
											text: "Это текст к которому прикреплен файл",
											indexInArticle: 0,
										},
									},
								},
							},
						],
					},
				],
				openSideEffect: {
					params: {
						url: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});
});
