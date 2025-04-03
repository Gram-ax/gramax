import { DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

const diffTree: DiffTreeAnyItem[] = [
	{
		type: "node",
		breadcrumbs: [
			{
				isTitle: true,
				name: "en",
				link: "gitlab.ics-it.ru/danil.kazanov/for_notes/master0_3/-/en",
				path: "for_notes/en/_index.md",
			},
		],
		logicpath: "en",
		childs: [
			{
				type: "node",
				breadcrumbs: [
					{
						isTitle: true,
						name: "Notes",
						link: "gitlab.ics-it.ru/danil.kazanov/for_notes/master0_3/-/en/notes",
						path: "for_notes/en/notes/_index.md",
					},
				],
				logicpath: "en/notes",
				childs: [
					{
						name: "AAA",
						isTitle: true,
						status: "new" as FileStatus,
						icon: null,
						filepath: {
							new: "en/notes/new-article/_index.md",
							old: "en/notes/new-article/_index.md",
						},
						logicpath: "en/notes/new-article",
						rawItem: {
							type: "item",
							status: "new" as FileStatus,
							title: "AAA",
							order: 11,
							filePath: {
								path: "en/notes/new-article/_index.md",
								oldPath: "en/notes/new-article/_index.md",
								hunks: [],
							},
							content: "---\norder: 11\nexternal: AAA\n---\n\n",
							hunks: [
								{
									value: "--- \norder: 11 \nexternal: AAA \n--- \n \n",
									type: "new" as FileStatus,
								},
								{
									value: "",
								},
							],
							oldContent: "",
							logicPath: "gitlab.ics-it.ru/danil.kazanov/for_notes/master0_3/-/en/notes/new-article",
							resources: [],
							isChanged: true,
							oldEditTree: null,
							newEditTree: {
								type: "doc",
								content: [
									{
										type: "paragraph",
										content: [
											{
												type: "text",
												text: "AAA",
											},
										],
									},
									{
										type: "view",
										attrs: {
											defs: [
												{
													name: "hierarchy",
													value: ["none"],
												},
											],
											orderby: [],
											groupby: [],
											select: [],
											display: "List",
										},
									},
								],
							},
							added: 5,
							deleted: 0,
						},
						type: "item",
						overview: {
							added: 5,
							removed: 0,
						},
						childs: [
							{
								type: "node",
								breadcrumbs: [],
								logicpath: "en/notes/new-article",
								childs: [
									{
										name: "BBB",
										isTitle: true,
										status: "new" as FileStatus,
										icon: null,
										filepath: {
											new: "en/notes/new-article/bbb.md",
											old: "en/notes/new-article/bbb.md",
										},
										logicpath: "en/notes/new-article/bbb",
										rawItem: {
											type: "item",
											status: "new" as FileStatus,
											title: "BBB",
											order: 1,
											filePath: {
												path: "en/notes/new-article/bbb.md",
												oldPath: "en/notes/new-article/bbb.md",
												hunks: [],
											},
											content: "---\norder: 1\nexternal: BBB\n---\n\n",
											hunks: [
												{
													value: "--- \norder: 1 \nexternal: BBB \n--- \n \n",
													type: "new" as FileStatus,
												},
												{
													value: "",
												},
											],
											oldContent: "",
											logicPath:
												"gitlab.ics-it.ru/danil.kazanov/for_notes/master0_3/-/en/notes/new-article/bbb",
											resources: [],
											isChanged: true,
											oldEditTree: null,
											newEditTree: {
												type: "doc",
												content: [
													{
														type: "paragraph",
														content: [
															{
																type: "text",
																text: "BBB",
															},
														],
													},
													{
														type: "paragraph",
													},
												],
											},
											added: 5,
											deleted: 0,
										},
										type: "item",
										overview: {
											added: 5,
											removed: 0,
										},
										childs: [
											{
												name: "bbb.png",
												isTitle: true,
												status: "new" as FileStatus,
												icon: "file-image",
												filepath: {
													new: "notes/aaa/bbb.png",
													old: "notes/new-article/bbb.png",
												},
												rawItem: {
													parentPath: {
														path: "notes/aaa/bbb.md",
														oldPath: "notes/new-article/bbb.md",
													},
													status: "new" as FileStatus,
													type: "resource",
													isChanged: true,
													filePath: {
														path: "notes/aaa/bbb.png",
														oldPath: "notes/new-article/bbb.png",
														hunks: [
															{
																value: "notes/",
															},
															{
																value: "new-article",
																type: "delete" as FileStatus,
															},
															{
																value: "aaa",
																type: "new" as FileStatus,
															},
															{
																value: "/bbb.png",
															},
														],
													},
													title: "bbb.png",
													added: 0,
													deleted: 0,
													content: "",
													oldContent: "",
													hunks: null,
												},
												type: "resource",
												overview: {
													added: 0,
													removed: 0,
												},
												childs: [],
											},
										],
									},
								],
							},
						],
					},
				],
			},
			{
				name: "Snippets test",
				isTitle: true,
				status: "delete" as FileStatus,
				icon: null,
				filepath: {
					new: "en/snippets-test.md",
					old: "en/snippets-test.md",
				},
				logicpath: "en/snippets-test",
				rawItem: {
					type: "item",
					status: "delete" as FileStatus,
					order: 9007199254740991,
					title: "Snippets test",
					filePath: {
						path: "en/snippets-test.md",
					},
					content: "---\norder: 4\ntitle: Snippets test\n---\n\nsss",
					hunks: [
						{
							value: "--- \norder: 4 \ntitle: Snippets test \n--- \n \nsss",
							type: "delete" as FileStatus,
						},
						{
							value: "",
						},
					],
					resources: [],
					isChanged: true,
					added: 0,
					deleted: 6,
					oldEditTree: {
						type: "doc",
						content: [
							{
								type: "paragraph",
								content: [
									{
										type: "text",
										text: "Snippets test",
									},
								],
							},
							{
								type: "paragraph",
								content: [
									{
										type: "text",
										text: "sss",
									},
								],
							},
						],
					},
					logicPath: "-/-/-/-/for_notes:HEAD/en/snippets-test",
				},
				type: "item",
				overview: {
					added: 0,
					removed: 6,
				},
				childs: [],
			},
		],
	},
	{
		type: "node",
		breadcrumbs: [
			{
				isTitle: true,
				name: "Заметки",
				link: "gitlab.ics-it.ru/danil.kazanov/for_notes/master0_3/-/notes",
				path: "for_notes/notes/_index.md",
			},
		],
		logicpath: "notes",
		childs: [
			{
				name: "AAA",
				isTitle: true,
				status: "new" as FileStatus,
				icon: null,
				filepath: {
					new: "notes/new-article/_index.md",
					old: "notes/new-article/_index.md",
				},
				logicpath: "notes/new-article",
				rawItem: {
					type: "item",
					status: "new" as FileStatus,
					title: "AAA",
					order: 11,
					filePath: {
						path: "notes/new-article/_index.md",
						oldPath: "notes/new-article/_index.md",
						hunks: [],
					},
					content: "---\norder: 11\ntitle: AAA\n---\n\n",
					hunks: [
						{
							value: "--- \norder: 11 \ntitle: AAA \n--- \n \n",
							type: "new" as FileStatus,
						},
						{
							value: "",
						},
					],
					oldContent: "",
					logicPath: "gitlab.ics-it.ru/danil.kazanov/for_notes/master0_3/-/notes/new-article",
					resources: [],
					isChanged: true,
					oldEditTree: null,
					newEditTree: {
						type: "doc",
						content: [
							{
								type: "paragraph",
								content: [
									{
										type: "text",
										text: "AAA",
									},
								],
							},
							{
								type: "view",
								attrs: {
									defs: [
										{
											name: "hierarchy",
											value: ["none"],
										},
									],
									orderby: [],
									groupby: [],
									select: [],
									display: "List",
								},
							},
						],
					},
					added: 5,
					deleted: 0,
				},
				type: "item",
				overview: {
					added: 5,
					removed: 0,
				},
				childs: [
					{
						type: "node",
						breadcrumbs: [],
						logicpath: "notes/new-article",
						childs: [
							{
								name: "BBB",
								isTitle: true,
								status: "new" as FileStatus,
								icon: null,
								filepath: {
									new: "notes/new-article/bbb.md",
									old: "notes/new-article/bbb.md",
								},
								logicpath: "notes/new-article/bbb",
								rawItem: {
									type: "item",
									status: "new" as FileStatus,
									title: "BBB",
									order: 1,
									filePath: {
										path: "notes/new-article/bbb.md",
										oldPath: "notes/new-article/bbb.md",
										hunks: [],
									},
									content: "---\norder: 1\ntitle: BBB\n---\n\n",
									hunks: [
										{
											value: "--- \norder: 1 \ntitle: BBB \n--- \n \n",
											type: "new" as FileStatus,
										},
										{
											value: "",
										},
									],
									oldContent: "",
									logicPath:
										"gitlab.ics-it.ru/danil.kazanov/for_notes/master0_3/-/notes/new-article/bbb",
									resources: [],
									isChanged: true,
									oldEditTree: null,
									newEditTree: {
										type: "doc",
										content: [
											{
												type: "paragraph",
												content: [
													{
														type: "text",
														text: "BBB",
													},
												],
											},
											{
												type: "paragraph",
											},
										],
									},
									added: 5,
									deleted: 0,
								},
								type: "item",
								overview: {
									added: 5,
									removed: 0,
								},
								childs: [],
							},
						],
					},
				],
			},
		],
	},
	{
		name: "тест сниппетов",
		isTitle: true,
		status: "delete" as FileStatus,
		icon: null,
		filepath: {
			new: "snippets-test.md",
			old: "snippets-test.md",
		},
		logicpath: "snippets-test",
		rawItem: {
			type: "item",
			status: "delete" as FileStatus,
			order: 9007199254740991,
			title: "тест сниппетов",
			filePath: {
				path: "snippets-test.md",
			},
			content:
				"---\norder: 4\ntitle: тест сниппетов\n---\n\nпараграф1-2\n\n\n\n[snippet:snippet-123]\n\nпараграф2",
			hunks: [
				{
					value: "--- \norder: 4 \ntitle: тест сниппетов \n--- \n \nпараграф1-2 \n \n \n \n[snippet:snippet-123] \n \nпараграф2",
					type: "delete" as FileStatus,
				},
				{
					value: "",
				},
			],
			resources: [],
			isChanged: true,
			added: 0,
			deleted: 12,
			oldEditTree: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "тест сниппетов",
							},
						],
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "параграф1-2",
							},
						],
					},
					{
						type: "paragraph",
					},
					{
						type: "snippet",
						attrs: {
							id: "snippet-123",
							title: "snippet-123",
							content: [
								{
									$$mdtype: "Tag",
									name: "p",
									attributes: {},
									children: ["фвфцвфцвфцфцв"],
								},
							],
						},
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "параграф2",
							},
						],
					},
				],
			},
			logicPath: "-/-/-/-/for_notes:HEAD/snippets-test",
		},
		type: "item",
		overview: {
			added: 0,
			removed: 12,
		},
		childs: [],
	},
];

export default diffTree;
