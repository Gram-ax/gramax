import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { describe, eq, test } from "../test/test";

const _path = (path: string) => new Path(path);

const root = new Path(process.env.ROOT_PATH).join(new Path("tests"));
const content = "something";
const content2 = "qwer";
const fp = new DiskFileProvider(root);

const run = async () => {
	await fp.delete(Path.empty);

	await describe("TauriFileProvider читает", async () => {
		await test("и записывает файл", async () => {
			await fp.write(_path("file"), content);
			const read = await fp.read(_path("file"));
			eq(read, content);

			await fp.write(_path("file2"), content2);
			const read2 = await fp.read(_path("file2"));

			eq(read2, content2);
		});

		await test("несуществующий файл", async () => {
			const read = await fp.read(_path("somedir/file"));
			eq(read, undefined);
		});

		await test("файл в директории", async () => {
			await fp.write(_path("dir/file"), content);
			const read = await fp.read(_path("dir/file"));

			eq(read, content);
		});

		await test("несуществующую директорию", async () => {
			const items = await fp.getItems(_path("getItems213123"));

			eq(items, undefined);
		});

		await test("пустую директорию", async () => {
			await fp.mkdir(_path("getItemsExist"));
			const items = await fp.getItems(_path("getItemsExist"));

			eq(items.length, 0);
		});

		await test("директорию с файлами", async () => {
			const path1 = _path("getItems/file");
			const path2 = _path("getItems/123/file");

			await fp.write(path1, content);
			await fp.write(path2, content);

			const items = await fp.getItems(_path("getItems"));

			eq(items.length, 2);
		});
	});

	await describe("TauriFileProvider удаляет", async () => {
		await test("файл", async () => {
			const path = _path("delete");
			await fp.write(path, content);
			await fp.delete(path);

			eq(await fp.exists(path), false);
		});

		await test("директорию", async () => {
			const path = _path("delete");
			await fp.write(_path("delete/test"), content);
			await fp.delete(path);

			eq(await fp.exists(_path("delete/test")), false);
			eq(await fp.exists(path), false);
		});

		await test("проверяет файл на существование", async () => {
			await fp.write(_path("exists"), content);
			const exists = await fp.exists(_path("exists"));
			eq(exists, true);

			const notExists = await fp.exists(_path("dasfa/not_exists"));
			eq(notExists, false);
		});

		await test("копирует файл", async () => {
			const from = _path("copy/from");
			const to = _path("copy/to");

			await fp.write(from, content);
			await fp.copy(from, to);

			eq(await fp.exists(from), true);
			eq(await fp.read(to), content);
		});

		await test("перемещает файл", async () => {
			const from = _path("move/from");
			const to = _path("move/to");

			await fp.write(from, content);
			await fp.move(from, to);

			eq(await fp.exists(from), false);
			eq(await fp.read(to), content);
		});
	});

	await describe("TauriFileProvider возвращает stat", async () => {
		await test("несуществующего файла", async () => {
			try {
				const res = await fp.getStat(_path("getStat/NotExists"));
				eq(res, "ENOENT");
			} catch (err) {
				eq(err.code, "ENOENT");
			}
		});

		await test("файла", async () => {
			const path = _path("getStat/file");
			await fp.write(path, "1");
			const stat = await fp.getStat(path);
			eq(Math.floor(stat.ctimeMs / 10), Math.floor(new Date().getTime() / 10));
			eq(Math.floor(stat.mtimeMs / 10), Math.floor(new Date().getTime() / 10));
			eq(stat.isFile(), true);
			eq(stat.path, path.value);
			eq(stat.size, 1);
			eq(stat.name, path.nameWithExtension);
		});

		await test("папки", async () => {
			const path = _path("getStat2");
			await fp.mkdir(path);
			const stat = await fp.getStat(path);
			eq(Math.floor(stat.ctimeMs / 10), Math.floor(new Date().getTime() / 10));
			eq(Math.floor(stat.mtimeMs / 10), Math.floor(new Date().getTime() / 10));
			eq(stat.isDirectory(), true);
			eq(stat.path, path.value);
			eq(stat.name, path.nameWithExtension);
		});
	});

	await fp.delete(Path.empty);
};

export default run;
