import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type { DiffItem, DiffItemResourceCollection, DiffResource } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import RevisionDiffTreePresenter from "./RevisionDiffTreePresenter";

describe("RevisionDiffTreePresenter", () => {
	const createDiffItem = (path: string, status = FileStatus.new): DiffItem => ({
		type: "item",
		filePath: { path, oldPath: path },
		status,
		title: path.split("/").pop(),
		resources: [],
		isChanged: true,
		added: 1,
		deleted: 0,
		hunks: [],
		order: 0,
	});

	const createDiffResource = (path: string, status = FileStatus.new): DiffResource => ({
		type: "resource",
		filePath: { path, oldPath: path },
		status,
		title: path.split("/").pop(),
		isChanged: true,
		added: 1,
		deleted: 0,
		hunks: [],
	});

	const createItemLink = (path: string, title?: string, type = ItemType.article): ItemLink => ({
		type,
		title: title || path.split("/").pop(),
		ref: { path: `catalog/${path}`, storageId: "1" },
		pathname: `/articles/${path}`,
		icon: "",
		isCurrentLink: false,
	});

	const createCategoryLink = (path: string, title: string, items: ItemLink[]): CategoryLink => ({
		...createItemLink(path, title, ItemType.category),
		type: ItemType.category,
		items,
		isExpanded: false,
		existContent: true,
	});

	test("создает плоское дерево для одиночного файла", () => {
		const items = [createItemLink("test.md")];
		const diffItems: DiffItemResourceCollection = {
			items: [createDiffItem("test.md")],
			resources: [],
		};

		const presenter = new RevisionDiffTreePresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.tree).toHaveLength(1);
		expect(result.tree[0]).toMatchObject({
			type: "item",
			name: "test.md",
			status: FileStatus.new,
			overview: { added: 1, removed: 0 },
			filepath: {
				new: "test.md",
				old: "test.md",
			},
		});
	});

	test("создает вложенную структуру для файлов в категориях", () => {
		const file = createItemLink("category/nested/file.md", "Nested File");
		const nested = createCategoryLink("category/nested", "Nested", [file]);
		const category = createCategoryLink("category", "Category", [nested]);
		const items = [category];

		const diffItems: DiffItemResourceCollection = {
			items: [createDiffItem("category/nested/file.md")],
			resources: [],
		};

		const presenter = new RevisionDiffTreePresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.tree).toHaveLength(1);
		expect(result.tree[0]).toMatchObject({
			type: "node",
			childs: [
				{
					type: "node",
					childs: [
						{
							type: "item",
							name: "Nested File",
							filepath: {
								new: "category/nested/file.md",
								old: "category/nested/file.md",
							},
							status: FileStatus.new,
						},
					],
				},
			],
		});
	});

	test("группирует множественные изменения в одной категории", () => {
		const files = [createItemLink("category/file1.md", "File 1"), createItemLink("category/file2.md", "File 2")];
		const category = createCategoryLink("category", "Category", files);
		const items = [category];

		const diffItems: DiffItemResourceCollection = {
			items: [createDiffItem("category/file1.md"), createDiffItem("category/file2.md")],
			resources: [],
		};

		const presenter = new RevisionDiffTreePresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.tree).toHaveLength(1);
		expect(result.tree[0]).toMatchObject({
			type: "node",
			childs: [
				{
					type: "item",
					name: "File 1",
					filepath: {
						new: "category/file1.md",
						old: "category/file1.md",
					},
					status: FileStatus.new,
				},
				{
					type: "item",
					name: "File 2",
					filepath: {
						new: "category/file2.md",
						old: "category/file2.md",
					},
					status: FileStatus.new,
				},
			],
		});
	});

	test("корректно обрабатывает ресурсы", () => {
		const article = createItemLink("article.md", "Article");
		const items = [article];

		const diffItems: DiffItemResourceCollection = {
			items: [createDiffItem("article.md")],
			resources: [createDiffResource("article.md/resource.png"), createDiffResource("article.md/data.json")],
		};

		const presenter = new RevisionDiffTreePresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.tree).toHaveLength(3);
		expect(result.tree[0]).toMatchObject({
			type: "item",
			name: "Article",
			childs: [],
			filepath: {
				new: "article.md",
				old: "article.md",
			},
		});
		expect(result.tree[1]).toMatchObject({
			type: "resource",
			name: "resource.png",
			icon: "file-image",
			filepath: {
				new: "article.md/resource.png",
				old: "article.md/resource.png",
			},
		});
		expect(result.tree[2]).toMatchObject({
			type: "resource",
			name: "data.json",
			icon: "settings",
			filepath: {
				new: "article.md/data.json",
				old: "article.md/data.json",
			},
		});
	});

	test("правильно считает общую статистику изменений", () => {
		const items = [createItemLink("new.md"), createItemLink("modified.md"), createItemLink("deleted.md")];

		const diffItems: DiffItemResourceCollection = {
			items: [
				{ ...createDiffItem("new.md"), status: FileStatus.new },
				{ ...createDiffItem("modified.md"), status: FileStatus.modified },
				{ ...createDiffItem("deleted.md"), status: FileStatus.delete },
			],
			resources: [
				{ ...createDiffResource("res1.png"), status: FileStatus.new },
				{ ...createDiffResource("res2.png"), status: FileStatus.delete },
			],
		};

		const presenter = new RevisionDiffTreePresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.overview).toEqual({
			added: 2,
			deleted: 2,
			modified: 1,
		});
	});

	test("обрабатывает переименование файлов", () => {
		const items = [createItemLink("new-name.md", "New Name")];

		const diffItems: DiffItemResourceCollection = {
			items: [
				{
					...createDiffItem("new-name.md"),
					filePath: {
						path: "new-name.md",
						oldPath: "old-name.md",
					},
					status: FileStatus.modified,
				},
			],
			resources: [],
		};

		const presenter = new RevisionDiffTreePresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.tree[0]).toMatchObject({
			type: "item",
			name: "New Name",
			filepath: {
				new: "new-name.md",
				old: "old-name.md",
			},
			status: FileStatus.modified,
		});
	});
});
