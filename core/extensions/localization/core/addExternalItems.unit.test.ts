import Path from "@core/FileProvider/Path/Path";
import type { Category } from "@core/FileStructue/Category/Category";
import type FileStructure from "@core/FileStructue/FileStructure";
import type { ItemProps } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { addExternalItems } from "./addExternalItems";

// Minimal Item/Category stand-ins: addExternalItems' pruning loop only reads
// logicPath / type / props / items and calls save(), so mocking is faithful for
// the array-mutation behaviour under test (no FileProvider IO needed here).
type MockItem = {
	logicPath: string;
	type: ItemType;
	props: { order?: number; private?: boolean };
	items?: MockItem[];
	ref?: unknown;
	save: () => Promise<void>;
};

const makeItem = (logicPath: string, type: ItemType = ItemType.article, filePath?: string): MockItem => ({
	logicPath,
	type,
	props: {},
	save: async () => {},
	ref: filePath ? { path: new Path(filePath), storageId: null } : undefined,
});

// `filePath` stands for the on-disk location, which differs from the logic path whenever
// the catalog keeps `.doc-root.yaml` in a subfolder — see the docroot test below.
const makeRoot = (logicPath: string, filePath: string, items: MockItem[]): MockItem => ({
	logicPath,
	type: ItemType.category,
	props: {},
	items,
	save: async () => {},
	ref: { path: { parentDirectoryPath: { removeExtraSymbols: { value: filePath } } } },
});

// Records what would hit the disk. Items addExternalItems creates itself are real `Article`s,
// so their save() goes through `FileStructure.saveArticle` — that is where the data loss shows up.
const makeFs = () => {
	const saved: { path: string; content: string }[] = [];
	const fs = {
		fp: { getItemRef: (path: Path) => ({ path, storageId: null }) },
		saveArticle: async (path: Path, content: string, _props: ItemProps) => {
			saved.push({ path: path.value, content });
		},
	};
	return { fs: fs as unknown as FileStructure, saved };
};

const call = (fromRoot: MockItem, toRoot: MockItem, fromBase?: string, toBase?: string, fs?: FileStructure) =>
	addExternalItems(
		fromRoot as unknown as Category,
		toRoot as unknown as Category,
		(fromBase ? new Path(fromBase) : {}) as Path,
		(toBase ? new Path(toBase) : {}) as Path,
		fs ?? ({ fp: {} } as unknown as FileStructure),
	);

describe("addExternalItems: удаление осиротевших элементов локализованного дерева", () => {
	test("удаляет два подряд идущих осиротевших элемента", async () => {
		const orphan1 = makeItem("to/orphan1");
		const orphan2 = makeItem("to/orphan2");
		const kept = makeItem("to/kept");
		const items = [orphan1, orphan2, kept];
		const toRoot = makeRoot("to", "to", items);
		const fromRoot = makeRoot("from", "from", [makeItem("from/kept")]);

		await call(fromRoot, toRoot);

		expect(items.map((i) => i.logicPath)).toEqual(["to/kept"]);
	});

	test("удаляет все элементы, если у владельца не осталось потомков", async () => {
		const items = [makeItem("to/a"), makeItem("to/b"), makeItem("to/c")];
		const toRoot = makeRoot("to", "to", items);
		const fromRoot = makeRoot("from", "from", []);

		await call(fromRoot, toRoot);

		expect(items).toEqual([]);
	});

	test("не перезаписывает переведённые статьи пустыми заглушками, когда каталог использует docroot", async () => {
		// Каталог `docs` держит `.doc-root.yaml` в подпапке `docs/`, поэтому путь на диске
		// (`docs/docs/en`) на один сегмент длиннее логического пути (`docs/en`). Сопоставление
		// по пути на диске не находило ни одной статьи: перевод вырезался из дерева, вместо него
		// создавалась заглушка с пустым контентом, и saveAll записывал её поверх настоящего файла.
		const translated = makeItem(
			"docs/en/article/editor/diagrams",
			ItemType.article,
			"docs/docs/en/article/editor/diagrams.md",
		);
		const items = [translated];
		const toRoot = makeRoot("docs/en", "docs/docs/en", items);
		const owner = makeItem(
			"docs/article/editor/diagrams",
			ItemType.article,
			"docs/docs/article/editor/diagrams.md",
		);
		const fromRoot = makeRoot("docs", "docs/docs", [owner]);
		const { fs, saved } = makeFs();

		await call(fromRoot, toRoot, "docs/docs", "docs/docs/en", fs);

		// Сравниваем по примитивам: заглушка — настоящий `Article`, и deep-equal уходит
		// в рекурсию по циклу parent ↔ items.
		expect(saved).toEqual([]);
		expect(items.map((i) => i.logicPath)).toEqual(["docs/en/article/editor/diagrams"]);
		expect(items[0]).toBe(translated);
	});
});
