import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import type { DiffItemResourceCollection } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export const publishApiData: DiffItemResourceCollection = {
	resources: [
		{
			type: "resource",
			title: "file.map",
			filePath: { path: "docs/catalog/category/file.map" },
			status: FileStatus.modified,
			hunks: [
				{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123' },
				{ value: "000a", type: FileStatus.delete },
				{ value: "456", type: FileStatus.new },
				{ value: "zzz" },
				{ value: "000a", type: FileStatus.delete },
				{ value: "456", type: FileStatus.new },
			],
			added: 2,
			deleted: 2,
			isChanged: true,
		},
		{
			type: "resource",
			title: "deleted_file.map",
			filePath: { path: "docs/catalog/category/deleted_file.map" },
			status: FileStatus.delete,
			hunks: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2',
					type: FileStatus.delete,
				},
			],
			added: 0,
			deleted: 1,
			isChanged: true,
		},
		{
			type: "resource",
			title: "added_file.map",
			filePath: { path: "docs/catalog/category/added_file.map" },
			status: FileStatus.new,
			hunks: [
				{
					value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\nnew file',
					type: FileStatus.new,
				},
			],
			added: 1,
			deleted: 0,
			isChanged: true,
		},
	],
	items: [
		{
			type: "item",
			title: "Статья 2 уровня",
			status: FileStatus.new,
			logicPath: "testCatalog/catalog/category/FirstLevel/FirstLevelArticle",
			filePath: { path: "docs/catalog/category/FirstLevel/FirstLevelArticle.md" },
			hunks: [
				{ value: '--\ntitle: "long article"\n---\n\n', type: FileStatus.new },
				{ value: [...Array(100).keys()].map(() => "looong title").join("\n"), type: FileStatus.new },
			],
			resources: [],
			order: 1,
			added: 2,
			deleted: 1,
			isChanged: true,
		},
		{
			type: "item",
			title: "123",
			filePath: { path: "docs/comments/new_article_0.md" },
			hunks: [{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2', type: FileStatus.delete }],
			added: 0,
			deleted: 1,
			order: 2,
			status: FileStatus.delete,
			resources: [],
			isChanged: true,
		},
		{
			type: "item",
			title: "Статья 2 уровня 2",
			logicPath: "testCatalog/catalog/category/FirstLevel/FirstLevelArticle2",
			filePath: { path: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md" },
			status: FileStatus.modified,
			hunks: [
				{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
				{ value: "1", type: FileStatus.delete },
				{ value: "2", type: FileStatus.new },
			],
			added: 1,
			deleted: 1,
			resources: [
				{
					title: "Ресурс",
					filePath: { path: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource.res" },
					status: FileStatus.modified,
					hunks: [
						{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
						{ value: "old", type: FileStatus.delete },
						{ value: FileStatus.new, type: FileStatus.new },
					],
					added: 1,
					deleted: 1,
					isChanged: true,
					type: "resource",
				},
			],
			order: 1,
			isChanged: true,
		},
		{
			type: "item",
			title: "123 2",
			logicPath: "testCatalog/comments/new_article_02",
			status: FileStatus.modified,
			filePath: {
				path: "docs/catalog/new/new_article_02.md",
				oldPath: "docs/comments/new_article_02.md",
				hunks: [
					{ value: "docs/" },
					{ value: "comments", type: FileStatus.delete },
					{ value: "catalog/new", type: FileStatus.new },
					{ value: "/new_article_02.md" },
				],
			},
			hunks: [
				{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
				{ value: "old", type: FileStatus.delete },
				{ value: FileStatus.new, type: FileStatus.new },
			],
			added: 1,
			deleted: 1,
			order: 1,
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
				hunks: [
					{ value: "docs/" },
					{ value: "multilang", type: FileStatus.delete },
					{ value: "test/folder", type: FileStatus.new },
					{ value: "/lang123.md2" },
				],
			},
			status: FileStatus.modified,
			hunks: [
				{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
				{ value: "111", type: FileStatus.delete },
				{ value: "222", type: FileStatus.new },
			],
			added: 1,
			deleted: 1,
			resources: [
				{
					title: "Переименованный ресурс",
					status: FileStatus.modified,
					filePath: {
						oldPath: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
						path: "docs/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
						hunks: [
							{ value: "docs/" },
							{ value: "catalog", type: FileStatus.delete },
							{ value: "category", type: FileStatus.new },
							{ value: "/FirstLevel/FirstLevelArticle2.md/resource2.res" },
						],
					},
					hunks: [
						{ value: '--\ntitle: "Ресурс"\n---\n\nтекст ресурса' },
						{ value: "старый текст", type: FileStatus.delete },
						{ value: "новый текст", type: FileStatus.new },
					],
					added: 1,
					deleted: 1,
					isChanged: true,
					type: "resource",
				},
			],
			order: 1,
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
			status: FileStatus.new,
			isChecked: true,
		},
		hunks: [
			{
				value: '--\ntitle: "long article"\n---\n\n',
				type: FileStatus.new,
			},
			{
				value: [...Array(100).keys()].map(() => "looong title").join("\n"),
				type: FileStatus.new,
			},
		],
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
			status: FileStatus.delete,
			isChecked: true,
		},
		hunks: [
			{
				value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2',
				type: FileStatus.delete,
			},
		],
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
						status: FileStatus.modified,
						filePath: {
							path: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource.res",
						},
						title: "Ресурс",
					},

					hunks: [
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
				},
			],
			status: FileStatus.modified,
			isChecked: true,
		},
		hunks: [
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
	},
	{
		isResource: false,
		data: {
			title: "123 2",
			filePath: {
				path: "docs/catalog/new/new_article_02.md",
				oldPath: "docs/comments/new_article_02.md",
				hunks: [
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
			status: FileStatus.modified,
			isChecked: true,
		},
		hunks: [
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
	},
	{
		isResource: false,
		data: {
			title: "Статья на русском 2",
			filePath: {
				path: "docs/test/folder/lang123.md2",
				oldPath: "docs/multilang/lang123.md2",
				hunks: [
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
						status: FileStatus.modified,
						filePath: {
							oldPath: "docs/catalog/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
							path: "docs/category/FirstLevel/FirstLevelArticle2.md/resource2.res",
							hunks: [
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
					hunks: [
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
				},
			],
			status: FileStatus.modified,
			isChecked: true,
		},
		hunks: [
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
			status: FileStatus.modified,
			isChecked: true,
		},
		hunks: [
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
			status: FileStatus.delete,
			isChecked: true,
		},
		hunks: [
			{
				value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2',
				type: FileStatus.delete,
			},
		],
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
			status: FileStatus.new,
			isChecked: true,
		},
		hunks: [
			{
				value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\nnew file',
				type: FileStatus.new,
			},
		],
	},
];
