import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export const publishApiData: { items: DiffItem[]; resources: DiffResource[] } = {
	resources: [
		{
			type: "resource",
			title: "file.map",
			filePath: { path: "docs/catalog/category/file.map" },
			changeType: FileStatus.modified,
			diff: {
				changes: [
					{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123' },
					{ value: "000a", type: FileStatus.delete },
					{ value: "456", type: FileStatus.new },
					{ value: "zzz" },
					{ value: "000a", type: FileStatus.delete },
					{ value: "456", type: FileStatus.new },
				],
				added: 2,
				removed: 2,
			},
			isChanged: true,
		},
		{
			type: "resource",
			title: "deleted_file.map",
			filePath: { path: "docs/catalog/category/deleted_file.map" },
			changeType: FileStatus.delete,
			diff: {
				changes: [{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2', type: FileStatus.delete }],
				added: 0,
				removed: 1,
			},
			isChanged: true,
		},
		{
			type: "resource",
			title: "added_file.map",
			filePath: { path: "docs/catalog/category/added_file.map" },
			changeType: FileStatus.new,
			diff: {
				changes: [{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\nnew file', type: FileStatus.new }],
				added: 1,
				removed: 0,
			},
			isChanged: true,
		},
	],
	items: [
		{
			type: "item",
			title: "Статья 2 уровня",
			changeType: FileStatus.new,
			logicPath: "testCatalog/catalog/category/FirstLevel/FirstLevelArticle",
			filePath: { path: "docs/catalog/category/FirstLevel/FirstLevelArticle.md" },
			diff: {
				changes: [
					{ value: '--\ntitle: "long article"\n---\n\n', type: FileStatus.new },
					{ value: [...Array(100).keys()].map(() => "looong title").join("\n"), type: FileStatus.new },
				],
				added: 2,
				removed: 1,
			},
			resources: [],
			isChanged: true,
		},
		{
			type: "item",
			title: "123",
			filePath: { path: "docs/comments/new_article_0.md" },
			diff: {
				changes: [{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2', type: FileStatus.delete }],
				added: 0,
				removed: 1,
			},
			changeType: FileStatus.delete,
			resources: [],
			isChanged: true,
		},
		{
			type: "item",
			title: "Статья 2 уровня 2",
			logicPath: "testCatalog/catalog/category/FirstLevel/FirstLevelArticle2",
			filePath: { path: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md" },
			changeType: FileStatus.modified,
			diff: {
				changes: [
					{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
					{ value: "1", type: FileStatus.delete },
					{ value: "2", type: FileStatus.new },
				],
				added: 1,
				removed: 1,
			},
			resources: [
				{
					title: "Ресурс",
					filePath: { path: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource.res" },
					changeType: FileStatus.modified,
					diff: {
						changes: [
							{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
							{ value: "old", type: FileStatus.delete },
							{ value: FileStatus.new, type: FileStatus.new },
						],
						added: 1,
						removed: 1,
					},
					isChanged: true,
					type: "resource",
				},
			],
			isChanged: true,
		},
		{
			type: "item",
			title: "123 2",
			logicPath: "testCatalog/comments/new_article_02",
			changeType: FileStatus.modified,
			filePath: {
				path: "docs/catalog/new/new_article_02.md",
				oldPath: "docs/comments/new_article_02.md",
				diff: [
					{ value: "docs/" },
					{ value: "comments", type: FileStatus.delete },
					{ value: "catalog/new", type: FileStatus.new },
					{ value: "/new_article_02.md" },
				],
			},
			diff: {
				changes: [
					{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
					{ value: "old", type: FileStatus.delete },
					{ value: FileStatus.new, type: FileStatus.new },
				],
				added: 1,
				removed: 1,
			},
			resources: [],
			isChanged: true,
		},
		{
			type: "item",
			title: "Статья на русском 2",
			logicPath: "testCatalog/multilang/lang2",
			filePath: {
				path: "docs/test/folder/lang123.md2",
				oldPath: "docs/multilang/lang123.md2",
				diff: [
					{ value: "docs/" },
					{ value: "multilang", type: FileStatus.delete },
					{ value: "test/folder", type: FileStatus.new },
					{ value: "/lang123.md2" },
				],
			},
			changeType: FileStatus.modified,
			diff: {
				changes: [
					{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
					{ value: "111", type: FileStatus.delete },
					{ value: "222", type: FileStatus.new },
				],
				added: 1,
				removed: 1,
			},
			resources: [
				{
					title: "Переименованный ресурс",
					changeType: FileStatus.modified,
					filePath: {
						oldPath: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
						path: "docs/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
						diff: [
							{ value: "docs/" },
							{ value: "catalog", type: FileStatus.delete },
							{ value: "category", type: FileStatus.new },
							{ value: "/FirstLevel/FirstLevelArticle2.md/resource2.res" },
						],
					},
					diff: {
						changes: [
							{ value: '--\ntitle: "Ресурс"\n---\n\nтекст ресурса' },
							{ value: "старый текст", type: FileStatus.delete },
							{ value: "новый текст", type: FileStatus.new },
						],
						added: 1,
						removed: 1,
					},
					isChanged: true,
					type: "resource",
				},
			],
			isChanged: true,
		},
	],
};

export const publishSideBarData: SideBarData[] = [
	{
		isResource: false,
		data: {
			title: "Статья 2 уровня",
			filePath: {
				path: "docs/catalog/category/FirstLevel/FirstLevelArticle.md",
			},
			isChanged: true,
			logicPath: "testCatalog/catalog/category/FirstLevel/FirstLevelArticle",
			resources: [],
			changeType: FileStatus.new,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "long article"\n---\n\n',
					type: FileStatus.new,
				},
				{
					value: "looong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title\nlooong title",
					type: FileStatus.new,
				},
			],
			added: 2,
			removed: 1,
		},
	},
	{
		isResource: false,
		data: {
			title: "123",
			filePath: {
				path: "docs/comments/new_article_0.md",
			},
			isChanged: true,
			resources: [],
			changeType: FileStatus.delete,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2',
					type: FileStatus.delete,
				},
			],
			added: 0,
			removed: 1,
		},
	},
	{
		isResource: false,
		data: {
			title: "Статья 2 уровня 2",
			filePath: {
				path: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md",
			},
			isChanged: true,
			logicPath: "testCatalog/catalog/category/FirstLevel/FirstLevelArticle2",
			resources: [
				{
					isResource: true,
					data: {
						changeType: FileStatus.modified,
						filePath: {
							path: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource.res",
						},
						title: "Ресурс",
					},

					diff: {
						changes: [
							{
								value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test',
							},
							{
								value: "old",
								type: FileStatus.delete,
							},
							{
								value: FileStatus.new,
								type: FileStatus.new,
							},
						],
						added: 1,
						removed: 1,
					},
				},
			],
			changeType: FileStatus.modified,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test',
				},
				{
					value: "1",
					type: FileStatus.delete,
				},
				{
					value: "2",
					type: FileStatus.new,
				},
			],
			added: 1,
			removed: 1,
		},
	},
	{
		isResource: false,
		data: {
			title: "123 2",
			filePath: {
				path: "docs/catalog/new/new_article_02.md",
				oldPath: "docs/comments/new_article_02.md",
				diff: [
					{
						value: "docs/",
					},
					{
						value: "comments",
						type: FileStatus.delete,
					},
					{
						value: "catalog/new",
						type: FileStatus.new,
					},
					{
						value: "/new_article_02.md",
					},
				],
			},
			isChanged: true,
			logicPath: "testCatalog/comments/new_article_02",
			resources: [],
			changeType: FileStatus.modified,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test',
				},
				{
					value: "old",
					type: FileStatus.delete,
				},
				{
					value: FileStatus.new,
					type: FileStatus.new,
				},
			],
			added: 1,
			removed: 1,
		},
	},
	{
		isResource: false,
		data: {
			title: "Статья на русском 2",
			filePath: {
				path: "docs/test/folder/lang123.md2",
				oldPath: "docs/multilang/lang123.md2",
				diff: [
					{
						value: "docs/",
					},
					{
						value: "multilang",
						type: FileStatus.delete,
					},
					{
						value: "test/folder",
						type: FileStatus.new,
					},
					{
						value: "/lang123.md2",
					},
				],
			},
			isChanged: true,
			logicPath: "testCatalog/multilang/lang2",
			resources: [
				{
					isResource: true,
					data: {
						changeType: FileStatus.modified,
						filePath: {
							oldPath: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
							path: "docs/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
							diff: [
								{
									value: "docs/",
								},
								{
									value: "catalog",
									type: FileStatus.delete,
								},
								{
									value: "category",
									type: FileStatus.new,
								},
								{
									value: "/FirstLevel/FirstLevelArticle2.md/resource2.res",
								},
							],
						},
						title: "Переименованный ресурс",
					},
					diff: {
						changes: [
							{
								value: '--\ntitle: "Ресурс"\n---\n\nтекст ресурса',
							},
							{
								value: "старый текст",
								type: FileStatus.delete,
							},
							{
								value: "новый текст",
								type: FileStatus.new,
							},
						],
						added: 1,
						removed: 1,
					},
				},
			],
			changeType: FileStatus.modified,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test',
				},
				{
					value: "111",
					type: FileStatus.delete,
				},
				{
					value: "222",
					type: FileStatus.new,
				},
			],
			added: 1,
			removed: 1,
		},
	},
	null,
	{
		isResource: false,
		data: {
			title: "file.map",
			filePath: {
				path: "docs/catalog/category/file.map",
			},
			isChanged: true,
			resources: [],
			changeType: FileStatus.modified,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123',
				},
				{
					value: "000a",
					type: FileStatus.delete,
				},
				{
					value: "456",
					type: FileStatus.new,
				},
				{
					value: "zzz",
				},
				{
					value: "000a",
					type: FileStatus.delete,
				},
				{
					value: "456",
					type: FileStatus.new,
				},
			],
			added: 2,
			removed: 2,
		},
	},
	{
		isResource: false,
		data: {
			title: "deleted_file.map",
			filePath: {
				path: "docs/catalog/category/deleted_file.map",
			},
			isChanged: true,
			resources: [],
			changeType: FileStatus.delete,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2',
					type: FileStatus.delete,
				},
			],
			added: 0,
			removed: 1,
		},
	},
	{
		isResource: false,
		data: {
			title: "added_file.map",
			filePath: {
				path: "docs/catalog/category/added_file.map",
			},
			isChanged: true,
			resources: [],
			changeType: FileStatus.new,
			isChecked: true,
		},
		diff: {
			changes: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\nnew file',
					type: FileStatus.new,
				},
			],
			added: 1,
			removed: 0,
		},
	},
];
