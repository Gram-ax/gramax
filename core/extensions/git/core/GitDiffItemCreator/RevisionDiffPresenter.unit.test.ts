import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type { DiffItem, DiffItemResourceCollection, DiffResource } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import RevisionDiffPresenter from "./RevisionDiffPresenter";

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
		isLfs: false,
		size: 0,
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
		isLfs: false,
		size: 0,
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

		const presenter = new RevisionDiffPresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.data).toHaveLength(1);
		expect(result.data[0]).toMatchObject({
			type: "item",
			name: "test.md",
			overview: { added: 1, removed: 0, status: FileStatus.new },
			filepath: {
				new: "test.md",
				old: "test.md",
			},
		});
	});

	test("создает плоскую структуру для файлов в категориях", () => {
		const file = createItemLink("category/nested/file.md", "Nested File");
		const nested = createCategoryLink("category/nested", "Nested", [file]);
		const category = createCategoryLink("category", "Category", [nested]);
		const items = [category];

		const diffItems: DiffItemResourceCollection = {
			items: [createDiffItem("category/nested/file.md")],
			resources: [],
		};

		const presenter = new RevisionDiffPresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.data).toHaveLength(2);
		expect(result.data[0]).toMatchObject({
			breadcrumbs: [
				{ link: "/articles/category", name: "Category", path: "catalog/category" },
				{ link: "/articles/category/nested", name: "Nested", path: "catalog/category/nested" },
			],
			hasChilds: true,
			indent: 0,
			logicpath: "",
			type: "node",
		});
	});

	test("группирует множественные изменения", () => {
		const files = [createItemLink("category/file1.md", "File 1"), createItemLink("category/file2.md", "File 2")];
		const category = createCategoryLink("category", "Category", files);
		const items = [category];

		const diffItems: DiffItemResourceCollection = {
			items: [createDiffItem("category/file1.md"), createDiffItem("category/file2.md")],
			resources: [],
		};

		const presenter = new RevisionDiffPresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.data).toHaveLength(3);
		expect(result.data[0]).toMatchObject({
			breadcrumbs: [{ link: "/articles/category", name: "Category", path: "catalog/category" }],
			hasChilds: true,
			indent: 0,
			logicpath: "",
			type: "node",
		});
	});

	test("корректно обрабатывает ресурсы", () => {
		const article = createItemLink("article.md", "Article");
		const items = [article];

		const diffItems: DiffItemResourceCollection = {
			items: [createDiffItem("article.md")],
			resources: [createDiffResource("article.md/resource.png"), createDiffResource("article.md/data.json")],
		};

		const presenter = new RevisionDiffPresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.data).toHaveLength(3);
		expect(result.data[0]).toMatchObject({
			type: "item",
			name: "Article",
			filepath: {
				new: "article.md",
				old: "article.md",
			},
		});
		expect(result.data[1]).toMatchObject({
			type: "resource",
			name: "resource.png",
			icon: "file-image",
			filepath: {
				new: "article.md/resource.png",
				old: "article.md/resource.png",
			},
		});
		expect(result.data[2]).toMatchObject({
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

		const presenter = new RevisionDiffPresenter({
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

		const presenter = new RevisionDiffPresenter({
			oldRoot: "catalog",
			newRoot: "catalog",
			oldItems: items,
			newItems: items,
			diffItems,
		});

		const result = presenter.present();

		expect(result.data[0]).toMatchObject({
			type: "item",
			name: "New Name",
			filepath: {
				new: "new-name.md",
				old: "old-name.md",
			},
		});
	});
});
