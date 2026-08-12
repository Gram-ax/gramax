import { countSelectedVisibleEntries, isDiffEntryVisible } from "@ext/git/core/Diff/logic/utils/visibleDiffEntries";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";

const node = (indent: number, logicpath: string): DiffFlattenTreeAnyItem =>
	({ type: "node", indent, logicpath, hasChilds: true, breadcrumbs: [] }) as DiffFlattenTreeAnyItem;

const item = (indent: number, path: string, oldPath = path): DiffFlattenTreeAnyItem =>
	({ type: "item", indent, filepath: { new: path, old: oldPath } }) as DiffFlattenTreeAnyItem;

const resource = (indent: number, path: string, oldPath = path): DiffFlattenTreeAnyItem =>
	({ type: "resource", indent, filepath: { new: path, old: oldPath } }) as DiffFlattenTreeAnyItem;

const selectAll = () => true;

describe("isDiffEntryVisible", () => {
	test("прячет вложенный в статью ресурс в упрощённом режиме", () => {
		expect(isDiffEntryVisible(resource(2, "docs/resources/pic.png"), false)).toBe(false);
		expect(isDiffEntryVisible(resource(2, "docs/resources/pic.png"), true)).toBe(true);
	});

	test("не трогает статьи и ресурсы верхнего уровня", () => {
		expect(isDiffEntryVisible(item(2, "docs/article.md"), false)).toBe(true);
		expect(isDiffEntryVisible(resource(1, "docs/pic.png"), false)).toBe(true);
		expect(isDiffEntryVisible(node(0, "docs"), false)).toBe(true);
	});
});

describe("countSelectedVisibleEntries", () => {
	test("картинка в статье: в упрощённом режиме одна строка, в расширенном две", () => {
		const changes = [item(1, "docs/article.md"), resource(2, "docs/resources/pic.png")];

		expect(countSelectedVisibleEntries(changes, false, selectAll)).toBe(1);
		expect(countSelectedVisibleEntries(changes, true, selectAll)).toBe(2);
	});

	test("ресурс верхнего уровня считается в обоих режимах", () => {
		const changes = [item(1, "docs/article.md"), resource(1, "docs/orphan.png")];

		expect(countSelectedVisibleEntries(changes, false, selectAll)).toBe(2);
		expect(countSelectedVisibleEntries(changes, true, selectAll)).toBe(2);
	});

	test("переименование — одна строка, хотя путей два", () => {
		const changes = [item(1, "docs/new.md", "docs/old.md")];

		expect(countSelectedVisibleEntries(changes, false, selectAll)).toBe(1);
		expect(countSelectedVisibleEntries(changes, true, selectAll)).toBe(1);
	});

	test("папки не считаются, невыбранное не считается", () => {
		const changes = [node(0, "docs"), item(1, "docs/a.md"), item(1, "docs/b.md")];
		const isSelected = (entry: DiffFlattenTreeAnyItem) =>
			entry.type !== "node" && entry.filepath.new === "docs/a.md";

		expect(countSelectedVisibleEntries(changes, false, isSelected)).toBe(1);
		expect(countSelectedVisibleEntries(changes, true, isSelected)).toBe(1);
	});

	test("пустое дерево", () => {
		expect(countSelectedVisibleEntries(undefined, false, selectAll)).toBe(0);
		expect(countSelectedVisibleEntries([], true, selectAll)).toBe(0);
	});
});
