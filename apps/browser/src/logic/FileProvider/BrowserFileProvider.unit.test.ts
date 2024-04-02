import "fake-indexeddb/auto";

import Path from "@core/FileProvider/Path/Path";
import { BrowserFileProvider } from "./BrowserFileProvider";

const _path = (path: string) => new Path(path);

describe("BrowserFileProvider", () => {
	const root = new Path("/testing/io");
	const content = "something";
	const content2 = "qwer";
	const fp = new BrowserFileProvider(root);

	describe("читает и записывает", () => {
		test("файл", async () => {
			await fp.write(_path("file"), content);
			const read = await fp.read(_path("file"));
			expect(read).toBe(content);

			await fp.write(_path("file2"), content2);
			const read2 = await fp.read(_path("file2"));

			expect(read2).toBe(content2);
		});

		test("несуществующий файл", async () => {
			const read = await fp.read(_path("somedir/file"));
			expect(read).toBeUndefined();
		});

		test("файл в директории", async () => {
			await fp.write(_path("dir/file"), content);
			const read = await fp.read(_path("dir/file"));

			expect(read).toBe(content);
		});

		test("пустую директорию", async () => {
			const items = await fp.getItems(_path("getItems"));

			expect(items).toStrictEqual([]);
		});

		test("директорию с файлами", async () => {
			const path1 = _path("getItems/file");
			const path2 = _path("getItems/123/file");

			await fp.write(path1, content);
			await fp.write(path2, content);

			const items = await fp.getItems(_path("getItems"));

			expect(items).toMatchObject([
				{ name: "file", type: "file" },
				{ name: "123", type: "dir" },
			]);

			expect(items.length).toBe(2);
		});
	});

	describe("удаляет", () => {
		test("файл", async () => {
			const path = _path("delete");
			await fp.write(path, content);
			await fp.delete(path);

			expect(await fp.exists(path)).toBe(false);
		});

		test("директорию", async () => {
			const path = _path("delete");
			await fp.write(_path("delete/test"), content);
			await fp.delete(path);

			expect(await fp.exists(_path("delete/test"))).toBe(false);
			expect(await fp.exists(path)).toBe(false);
		});

		test("пустые директории", async () => {
			await fp.write(_path("folder1/folder1-1/file"), content);
			await fp.write(_path("folder1/folder1-2/file"), content);
			await fp.delete(_path("folder1/folder1-1/file"));
			await fp.deleteEmptyFolders(_path("folder1"));

			expect(await fp.exists(_path("folder1/folder1-2/file"))).toBe(true);
			expect(await fp.exists(_path("folder1/folder1-1/file"))).toBe(false);
			expect(await fp.exists(_path("folder1/folder1-1"))).toBe(false);
		});
	});

	test("проверяет файл на существование", async () => {
		await fp.write(_path("exists"), content);
		const exists = await fp.exists(_path("exists"));
		expect(exists).toBe(true);

		const notExists = await fp.exists(_path("dasfa/not_exists"));
		expect(notExists).toBe(false);
	});

	test("копирует файл", async () => {
		const from = _path("copy/from");
		const to = _path("copy/to");

		await fp.write(from, content);
		await fp.copy(from, to);

		expect(await fp.exists(from)).toBe(true);
		expect(await fp.read(to)).toBe(content);
	});

	test("перемещает файл", async () => {
		const from = _path("move/from");
		const to = _path("move/to");

		await fp.write(from, content);
		await fp.move(from, to);

		expect(await fp.exists(from)).toBe(false);
		expect(await fp.read(to)).toBe(content);
	});
});
