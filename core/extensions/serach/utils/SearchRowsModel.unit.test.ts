import Url from "@core-ui/ApiServices/Types/Url";
import type {
	SearchArticleResult,
	SearchCatalogResult,
	SearchResult,
	SearchResultBlockItem,
	SearchResultItem,
} from "@ext/serach/Searcher";
import { buildArticleRows, type RowSearchResult } from "@ext/serach/utils/SearchRowsModel";

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
			refPath: "",
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
				url: "gramax-docs",
			},
			items: [
				{
					type: "paragraph",
					searchText: "set the logo using the button",
					items: [
						{ type: "text", text: "...set the " },
						{ type: "highlight", text: "logo" },
						{ type: "text", text: " using the button..." },
					],
				},
			],
		};
		const result = buildArticleRows([searchData]);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: "0",
				url: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "link",
						id: "1",
						url: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "set the logo using the button",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...set the " },
							{ type: "highlight", text: "logo" },
							{ type: "text", text: " using the button..." },
						],
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "set the logo using the button",
									indexInArticle: 0,
								},
							},
						},
					},
				],
				openSideEffect: {
					params: {
						pathname: "release-notes",
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
			refPath: "",
			catalog: {
				name: "Gramax",
				title: "Gramax Docs",
				url: "gramax-docs",
			},
			items: [
				{
					type: "paragraph",
					searchText: "set the logo using the button",
					items: [
						{ type: "text", text: "...set the " },
						{ type: "highlight", text: "logo" },
						{ type: "text", text: " using the button..." },
					],
				},
				{
					type: "paragraph",
					searchText: "make logo",
					items: [
						{ type: "text", text: "...make " },
						{ type: "highlight", text: "logo" },
					],
				},
				{
					type: "paragraph",
					searchText: "show logo in title",
					items: [
						{ type: "text", text: "...show " },
						{ type: "highlight", text: "logo" },
						{ type: "text", text: " in title..." },
					],
				},
				{
					type: "paragraph",
					searchText: " remove logo from title",
					items: [
						{ type: "text", text: "...remove " },
						{ type: "highlight", text: "logo" },
						{ type: "text", text: " from title..." },
					],
				},
			],
		};
		const result = buildArticleRows([searchData]);
		expect(result.rows).toEqual([
			{
				type: "article",
				rawResult: searchData,
				id: "0",
				url: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "link",
						id: "1",
						url: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "set the logo using the button",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...set the " },
							{ type: "highlight", text: "logo" },
							{ type: "text", text: " using the button..." },
						],
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "set the logo using the button",
									indexInArticle: 0,
								},
							},
						},
					},
					{
						type: "link",
						id: "2",
						url: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "make logo",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...make " },
							{ type: "highlight", text: "logo" },
						],
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "make logo",
									indexInArticle: 0,
								},
							},
						},
					},
					{
						type: "link",
						id: "3",
						url: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "show logo in title",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...show " },
							{ type: "highlight", text: "logo" },
							{ type: "text", text: " in title..." },
						],
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "show logo in title",
									indexInArticle: 0,
								},
							},
						},
					},
					{
						type: "link",
						id: "4",
						url: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: " remove logo from title",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...remove " },
							{ type: "highlight", text: "logo" },
							{ type: "text", text: " from title..." },
						],
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: " remove logo from title",
									indexInArticle: 0,
								},
							},
						},
					},
				],
				openSideEffect: {
					params: {
						pathname: "release-notes",
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
			refPath: "",
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
						{ type: "text", text: "L" },
						{ type: "highlight", text: "og" },
						{ type: "text", text: "o" },
					],
					items: [
						{
							type: "paragraph",
							searchText: "set the logo using the button",
							items: [
								{ type: "text", text: "...set the " },
								{ type: "highlight", text: "logo" },
								{ type: "text", text: " using the button..." },
							],
						},
						{
							type: "paragraph",
							searchText: "Logo",
							items: [{ type: "text", text: "Logo" }],
						},
						{
							type: "paragraph",
							searchText: "Logo",
							items: [{ type: "text", text: "Logo" }],
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
				id: "0",
				url: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "block",
						id: "1",
						url: Url.from({
							pathname: "release-notes",
							query: { highlightFragment: "Logo", highlightFragmentIndex: "0" },
						}),
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "Logo",
									indexInArticle: 0,
								},
							},
						},
						breadcrumbs: [
							{
								type: "header",
								title: [
									{ type: "text", text: "L" },
									{ type: "highlight", text: "og" },
									{ type: "text", text: "o" },
								],
							},
						],
						children: [
							{
								type: "link",
								id: "2",
								url: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "set the logo using the button",
										highlightFragmentIndex: "0",
									},
								}),
								marks: [
									{ type: "text", text: "...set the " },
									{ type: "highlight", text: "logo" },
									{ type: "text", text: " using the button..." },
								],
								openSideEffect: {
									params: {
										pathname: "release-notes",
										fragmentInfo: {
											text: "set the logo using the button",
											indexInArticle: 0,
										},
									},
								},
							},
							{
								type: "link",
								id: "3",
								url: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "Logo",
										highlightFragmentIndex: "2",
									},
								}),
								marks: [{ type: "text", text: "Logo" }],
								openSideEffect: {
									params: {
										pathname: "release-notes",
										fragmentInfo: {
											text: "Logo",
											indexInArticle: 2,
										},
									},
								},
							},
							{
								type: "link",
								id: "4",
								url: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "Logo",
										highlightFragmentIndex: "3",
									},
								}),
								marks: [{ type: "text", text: "Logo" }],
								openSideEffect: {
									params: {
										pathname: "release-notes",
										fragmentInfo: {
											text: "Logo",
											indexInArticle: 3,
										},
									},
								},
							},
						],
					},
				],
				openSideEffect: {
					params: {
						pathname: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should set correct link for element link", () => {
		const paragraphs: SearchResultItem[] = [
			{
				type: "paragraph",
				searchText: "set the logo using the button",
				items: [
					{ type: "text", text: "...set the " },
					{ type: "highlight", text: "logo" },
					{ type: "text", text: " using the button..." },
				],
			},
			{
				type: "paragraph",
				searchText: "make logo",
				items: [
					{ type: "text", text: "...make " },
					{ type: "highlight", text: "logo" },
				],
			},
			{
				type: "paragraph",
				searchText: "show logo in title",
				items: [
					{ type: "text", text: "...show " },
					{ type: "highlight", text: "logo" },
					{ type: "text", text: " in title..." },
				],
			},
			{
				type: "paragraph",
				searchText: " remove logo from title",
				items: [
					{ type: "text", text: "...remove " },
					{ type: "highlight", text: "logo" },
					{ type: "text", text: " from title..." },
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
			refPath: "",
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
						{ type: "text", text: "L" },
						{ type: "highlight", text: "og" },
						{ type: "text", text: "o" },
					],
					items: [],
				},
			],
		};
		const { rowIdLinkMap } = buildArticleRows([searchData]);

		expect(rowIdLinkMap.size).toEqual(6);
		expect(rowIdLinkMap.get("0").url).toEqual(Url.from({ pathname: "release-notes" }));
		expect(rowIdLinkMap.get("1").url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "set the logo using the button", highlightFragmentIndex: "0" },
			}),
		);
		expect(rowIdLinkMap.get("2").url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "make logo", highlightFragmentIndex: "0" },
			}),
		);
		expect(rowIdLinkMap.get("3").url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "show logo in title", highlightFragmentIndex: "0" },
			}),
		);
		expect(rowIdLinkMap.get("4").url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: " remove logo from title", highlightFragmentIndex: "0" },
			}),
		);
		expect(rowIdLinkMap.get("5").url).toEqual(
			Url.from({
				pathname: "release-notes",
				query: { highlightFragment: "Logo", highlightFragmentIndex: "4" },
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
				refPath: "",
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
						searchText: "set the logo using the button",
						items: [
							{ type: "text", text: "...set the " },
							{ type: "highlight", text: "logo" },
							{ type: "text", text: " using the button..." },
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
				id: "0",
				url: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "link",
						id: "1",
						url: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "set the logo using the button",
								highlightFragmentIndex: "0",
							},
						}),
						marks: [
							{ type: "text", text: "...set the " },
							{ type: "highlight", text: "logo" },
							{ type: "text", text: " using the button..." },
						],
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "set the logo using the button",
									indexInArticle: 0,
								},
							},
						},
					},
				],
				openSideEffect: {
					params: {
						pathname: "release-notes",
					},
				},
			},
			{
				type: "catalog",
				rawResult: searchData[1],
				id: "2",
				url: Url.from({ pathname: "caturl" }),
				openSideEffect: {
					params: {
						pathname: "caturl",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle paragraphs and blocks inside block with embedded link title", () => {
		const searchData: SearchArticleResult = {
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
			refPath: "",
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
							text: "Fragment with file",
						},
					],
					embeddedLinkTitle: [
						{
							type: "text",
							text: "Some file",
						},
					],
					items: [
						{
							type: "paragraph",
							searchText: "set the logo using the button",
							items: [
								{ type: "text", text: "...set the " },
								{ type: "highlight", text: "logo" },
								{ type: "text", text: " using the button..." },
							],
						},
						{
							type: "block",
							title: [
								{
									type: "text",
									text: "Block inside file",
								},
							],
							items: [
								{
									type: "paragraph",
									searchText: "Content",
									items: [{ type: "text", text: "Content" }],
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
				id: "0",
				url: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "file-block",
						id: "1",
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "Fragment with file",
									indexInArticle: 0,
								},
							},
						},
						url: Url.from({
							pathname: "release-notes",
							query: { highlightFragment: "Fragment with file", highlightFragmentIndex: "0" },
						}),
						breadcrumbs: [
							{
								type: "file",
								title: (searchData.items[0] as SearchResultBlockItem).title,
								fileName: [
									{
										type: "text",
										text: "Some file",
									},
								],
							},
						],
						children: [
							{
								type: "link",
								id: "2",
								url: Url.from({
									pathname: "release-notes",
									query: { highlightFragment: "Fragment with file", highlightFragmentIndex: "0" },
								}),
								marks: [
									{ type: "text", text: "...set the " },
									{ type: "highlight", text: "logo" },
									{ type: "text", text: " using the button..." },
								],
								openSideEffect: {
									params: {
										pathname: "release-notes",
										fragmentInfo: {
											text: "Fragment with file",
											indexInArticle: 0,
										},
									},
								},
							},
							{
								type: "block",
								id: "3",
								breadcrumbs: [
									{
										type: "header",
										title: [
											{
												type: "text",
												text: "Block inside file",
											},
										],
									},
								],
								children: [
									{
										type: "link",
										id: "4",
										url: Url.from({
											pathname: "release-notes",
											query: {
												highlightFragment: "Fragment with file",
												highlightFragmentIndex: "0",
											},
										}),
										marks: [{ type: "text", text: "Content" }],
										openSideEffect: {
											params: {
												pathname: "release-notes",
												fragmentInfo: {
													text: "Fragment with file",
													indexInArticle: 0,
												},
											},
										},
									},
								],
								openSideEffect: {
									params: {
										pathname: "release-notes",
										fragmentInfo: {
											text: "Fragment with file",
											indexInArticle: 0,
										},
									},
								},
								url: Url.from({
									pathname: "release-notes",
									query: { highlightFragment: "Fragment with file", highlightFragmentIndex: "0" },
								}),
							},
						],
					},
				],
				openSideEffect: {
					params: {
						pathname: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});

	it("should handle breadcrumbs with file", () => {
		const searchData: SearchArticleResult = {
			type: "article",
			url: "release-notes",
			title: [
				{
					type: "text",
					text: "Release Notes",
				},
			],
			refPath: "",
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
							text: "Chapter with ",
						},
						{
							type: "highlight",
							text: "file",
						},
					],
					items: [
						{
							type: "block",
							title: [
								{
									type: "text",
									text: "text attached to the ",
								},
								{
									type: "highlight",
									text: "file",
								},
							],
							embeddedLinkTitle: [
								{
									type: "text",
									text: "This is ",
								},
								{
									type: "highlight",
									text: "name",
								},
								{
									type: "text",
									text: " of file.pdf",
								},
							],
							items: [
								{
									type: "block",
									title: [
										{
											type: "text",
											text: "This is chapter ",
										},
										{
											type: "highlight",
											text: "inside file",
										},
									],
									items: [
										{
											type: "paragraph",
											searchText: "This is paragraph",
											items: [
												{
													type: "highlight",
													text: "This is",
												},
												{
													type: "text",
													text: " paragraph",
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
				id: "0",
				url: Url.from({ pathname: "release-notes" }),
				items: [
					{
						type: "file-block",
						id: "1",
						openSideEffect: {
							params: {
								pathname: "release-notes",
								fragmentInfo: {
									text: "text attached to the file",
									indexInArticle: 0,
								},
							},
						},
						url: Url.from({
							pathname: "release-notes",
							query: {
								highlightFragment: "text attached to the file",
								highlightFragmentIndex: "0",
							},
						}),
						breadcrumbs: [
							{
								type: "header",
								title: [
									{
										type: "text",
										text: "Chapter with ",
									},
									{
										type: "highlight",
										text: "file",
									},
								],
							},
							{
								type: "file",
								title: [
									{
										type: "text",
										text: "text attached to the ",
									},
									{
										type: "highlight",
										text: "file",
									},
								],
								fileName: [
									{
										type: "text",
										text: "This is ",
									},
									{
										type: "highlight",
										text: "name",
									},
									{
										type: "text",
										text: " of file.pdf",
									},
								],
							},
							{
								type: "header",
								title: [
									{
										type: "text",
										text: "This is chapter ",
									},
									{
										type: "highlight",
										text: "inside file",
									},
								],
							},
						],
						children: [
							{
								type: "link",
								id: "2",
								url: Url.from({
									pathname: "release-notes",
									query: {
										highlightFragment: "text attached to the file",
										highlightFragmentIndex: "0",
									},
								}),
								marks: [
									{ type: "highlight", text: "This is" },
									{ type: "text", text: " paragraph" },
								],
								openSideEffect: {
									params: {
										pathname: "release-notes",
										fragmentInfo: {
											text: "text attached to the file",
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
						pathname: "release-notes",
					},
				},
			},
		] satisfies RowSearchResult[]);
	});
});
