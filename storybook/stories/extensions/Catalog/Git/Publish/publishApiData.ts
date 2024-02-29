import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

const data: { items: DiffItem[]; resources: DiffResource[] } = {
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
							{ value: "new", type: FileStatus.new },
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
					{ value: "new", type: FileStatus.new },
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
				path: "docs/multilang/lang123.md2",
				oldPath: "docs/multilang/lang2.md2",
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

// const data2 = {
// 	items: [
// 		{
// 			type: "item",
// 			title: "1",
// 			changeType: ChangeType.add,
// 			logicPath: "logic/1",
// 			filePath: { path: "filepath/1" },
// 			diff: [{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2', type: ChangeDiffType.added }],
// 			resources: [],
// 			isChanged: true,
// 		},
// 		{
// 			type: "item",
// 			title: "2",
// 			filePath: { path: "filepath/2" },
// 			diff: [{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\n2', type: ChangeDiffType.removed }],
// 			changeType: ChangeType.delete,
// 			resources: [
// 				{
// 					title: "Ресурс 1",
// 					filePath: { path: "resource/1" },
// 					changeType: ChangeType.change,
// 					diff: [
// 						{ value: '--\ntitle: "123"\n---\n\ncontent123\n\n123\ntest test test' },
// 						{ value: "old", type: ChangeDiffType.removed },
// 						{ value: "new", type: ChangeDiffType.added },
// 					],
// 					isChanged: true,
// 					type: "resource",
// 				},
// 			],
// 			isChanged: true,
// 		},
// 	],
// };

export default data;
