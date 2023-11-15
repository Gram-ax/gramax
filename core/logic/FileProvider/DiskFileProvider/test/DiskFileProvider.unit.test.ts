import fs from "fs";
import Path from "../../Path/Path";
import DiskFileProvider from "../DiskFileProvider";

describe("DiskFileProvider", () => {
	const rootPath = __dirname + "/rootPath";
	const dfp = new DiskFileProvider(rootPath);
	beforeEach(() => {
		fs.mkdirSync(rootPath);
	});
	afterEach(() => {
		fs.rmSync(rootPath, { recursive: true, force: true, maxRetries: 5 });
	});

	describe("создаёт", () => {
		test("файл", async () => {
			await dfp.write(new Path("/folder/1.txt"), "content");

			const res = fs.existsSync(rootPath + "/folder/1.txt");
			expect(res).toEqual(true);
		});
		test("папку", async () => {
			await dfp.mkdir(new Path("/folder"));

			const res = fs.existsSync(rootPath + "/folder");
			expect(res).toEqual(true);
		});
	});
	describe("удаляет", () => {
		test("файл", async () => {
			fs.mkdirSync(rootPath + "/folder");
			fs.writeFileSync(rootPath + "/folder/1.txt", "content");

			await dfp.delete(new Path("/folder/1.txt"));

			const res = fs.existsSync(rootPath + "/folder/1.txt");
			expect(res).toEqual(false);
		});
		test("папку", async () => {
			fs.mkdirSync(rootPath + "/folder");

			await dfp.delete(new Path("/folder/"));

			const res = fs.existsSync(rootPath + "/folder/");
			expect(res).toEqual(false);
		});
	});
	describe("перемещает", () => {
		test("файл", async () => {
			fs.mkdirSync(rootPath + "/folder");
			fs.writeFileSync(rootPath + "/folder/1.txt", "content");

			await dfp.move(new Path("/folder/1.txt"), new Path("/folder2/2.txt"));

			const res = fs.existsSync(rootPath + "/folder2/2.txt");
			expect(res).toEqual(true);
		});
		test("папку", async () => {
			fs.mkdirSync(rootPath + "/folder/old/dir1", { recursive: true });
			fs.mkdirSync(rootPath + "/folder/old/dir2", { recursive: true });
			fs.writeFileSync(rootPath + "/folder/old/1.txt", "content");
			fs.writeFileSync(rootPath + "/folder/old/2.txt", "content2");
			fs.writeFileSync(rootPath + "/folder/old/dir1/1.txt", "content");
			fs.writeFileSync(rootPath + "/folder/old/dir1/2.txt", "content2");

			await dfp.move(new Path("/folder/old"), new Path("/folder2/new"));
			const files = fs.readdirSync(rootPath + "/folder2/new");
			expect(files.length).toEqual(4);
		});
	});
});
