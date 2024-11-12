import { FileStatus } from "@ext/Watchers/model/FileStatus";
import formatComment from "@ext/git/actions/Publish/logic/formatComment";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";

describe("Комментарий для коммита автоматически формируется, если", () => {
	test("изменён 1 файл", () => {
		const data: SideBarData[] = [
			{
				isResource: false,
				data: {
					changeType: FileStatus.modified,
					filePath: { path: "a/b/c.md", oldPath: "a/b/c.md" },
					isChanged: true,
					isChecked: true,
					resources: [],
					title: "Title",
				},
			},
		];

		const expected = `Update file: a/b/c.md`;

		expect(formatComment(data)).toEqual(expected);
	});

	test("изменёны 2 файла, но выбран 1", () => {
		const data: SideBarData[] = [
			{
				isResource: false,
				data: {
					changeType: FileStatus.modified,
					filePath: { path: "a/b/c.md", oldPath: "a/b/c.md" },
					isChanged: true,
					isChecked: true,
					resources: [],
					title: "Title",
				},
			},
			{
				isResource: false,
				data: {
					changeType: FileStatus.modified,
					filePath: { path: "a/b/c1.md", oldPath: "a/b/c1.md" },
					isChanged: true,
					isChecked: false,
					resources: [],
					title: "Title",
				},
			},
		];

		const expected = `Update file: a/b/c.md`;

		expect(formatComment(data)).toEqual(expected);
	});

	test("изменёны 2 файла", () => {
		const data: SideBarData[] = [
			{
				isResource: false,
				data: {
					changeType: FileStatus.modified,
					filePath: { path: "a/b/c.md", oldPath: "a/b/c.md" },
					isChanged: true,
					isChecked: true,
					resources: [],
					title: "Title",
				},
			},
			{
				isResource: false,
				data: {
					changeType: FileStatus.modified,
					filePath: { path: "a/b/c1.md", oldPath: "a/b/c1.md" },
					isChanged: true,
					isChecked: true,
					resources: [],
					title: "Title",
				},
			},
		];

		const expected = `Update 2 files\n\n - a/b/c.md\n - a/b/c1.md`;

		expect(formatComment(data)).toEqual(expected);
	});

	test("статья переименована", () => {
		const data: SideBarData[] = [
			{
				isResource: false,
				data: {
					changeType: FileStatus.modified,
					filePath: { path: "a/b/c.md", oldPath: "a/b/d.md" },
					isChanged: true,
					isChecked: true,
					resources: [],
					title: "Title",
				},
			},
		];

		const expected = `Update file: a/b/d.md -> a/b/c.md`;

		expect(formatComment(data)).toEqual(expected);
	});

	test("изменён ресурс статьи", () => {
		const data: SideBarData[] = [
			{
				isResource: false,
				data: {
					changeType: FileStatus.current,
					filePath: { path: "a/b/c.md", oldPath: "a/b/c.md" },
					isChanged: false,
					isChecked: true,
					resources: [
						{
							isResource: true,
							data: {
								filePath: { path: "a/b/r", oldPath: "a/b/r" },
								title: "R",
								changeType: FileStatus.current,
							},
						},
					],
					title: "Title",
				},
			},
		];

		const expected = `Update 2 files\n\n - a/b/c.md\n   - a/b/r`;

		expect(formatComment(data)).toEqual(expected);
	});

	test("ресурс статьи удалён", () => {
		const data: SideBarData[] = [
			{
				isResource: false,
				data: {
					changeType: FileStatus.current,
					filePath: { path: "a/b/c.md", oldPath: "a/b/c.md" },
					isChanged: false,
					isChecked: true,
					resources: [
						{
							isResource: true,
							data: {
								changeType: FileStatus.delete,
								filePath: { path: null, oldPath: "a/b/r" },
								title: "R",
							},
						},
					],
					title: "Title",
				},
			},
		];

		const expected = `Update 2 files\n\n - a/b/c.md\n   - a/b/r`;

		expect(formatComment(data)).toEqual(expected);
	});
});
