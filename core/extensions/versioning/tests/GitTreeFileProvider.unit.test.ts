import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";

const root = new Path([__dirname, "__test"]);
const repoPath = new Path("repo");
const dfp = new DiskFileProvider(root);
const git = new GitCommands(dfp, repoPath);
const gitfp = new GitTreeFileProvider(git);

const creds = {
	userName: "test",
	userEmail: "test@test.com",
	sourceType: SourceType.gitLab,
};

let oid: string = null;

const moveTestImage = async () => {
	const dfp = new DiskFileProvider(new Path(__dirname));
	await dfp.copy(new Path("testImage.png"), new Path(["__test", "repo", "testImage.png"]));
};

const getTestImageBuffer = async () => {
	const dfp = new DiskFileProvider(new Path(__dirname));
	return dfp.readAsBinary(new Path("testImage.png"));
};

const prepareRepo = async () => {
	await dfp.mkdir(repoPath);
	await git.init(creds);

	await moveTestImage();

	await dfp.write(repoPath.join(new Path("file")), "content");
	await dfp.write(repoPath.join(new Path("dir/file2")), "content2");
	await dfp.write(repoPath.join(new Path("to-be-deleted")), "");

	await git.add([new Path("file"), new Path("dir/file2"), new Path("to-be-deleted"), new Path("testImage.png")]);
	const commit = await git.commit("f", creds);
	oid = commit.toString();
	await dfp.delete(repoPath.join(new Path("to-be-deleted")));

	await dfp.write(repoPath.join(new Path("file")), "text");
	await git.add();
	await git.commit("w", creds);
};

describe("GitTreeFileProvider", () => {
	beforeAll(prepareRepo);

	afterAll(async () => await dfp.delete(Path.empty));

	describe("читает файл", () => {
		test("на хеде", async () => {
			const file = await gitfp.read(new Path("file"));
			expect(file).toBe("text");

			const file2 = await gitfp.read(new Path("dir/file2"));
			expect(file2).toBe("content2");

			const image = await gitfp.readAsBinary(new Path("testImage.png"));
			expect(image).toEqual(await getTestImageBuffer());
		});

		test("на конкретном коммите", async () => {
			expect(await gitfp.read(new Path(`:commit-${oid}/file`))).toBe("content");
			expect(await gitfp.read(new Path(`:commit-${oid}/dir/file2`))).toBe("content2");

			const image = await gitfp.readAsBinary(new Path(`:commit-${oid}/testImage.png`));
			expect(image).toEqual(await getTestImageBuffer());
		});

		test("на ветке master", async () => {
			expect(await gitfp.read(new Path(":master/file"))).toBe("text");
			expect(await gitfp.read(new Path(":master/dir/file2"))).toBe("content2");

			const image = await gitfp.readAsBinary(new Path(":master/testImage.png"));
			expect(image).toEqual(await getTestImageBuffer());
		});

		test("несуществующий файл", async () => {
			expect(await gitfp.readAsBinary(new Path(`:commit-${oid}/not-exists`))).toBeUndefined();
			expect(await gitfp.readAsBinary(new Path(":master/not-exists"))).toBeUndefined();
		});
	});

	describe("читает директорию", () => {
		test("на хеде", async () => {
			expect(await gitfp.readdir(Path.empty)).toEqual(expect.arrayContaining(["file", "dir"]));
			expect(await gitfp.readdir(new Path("dir"))).toEqual(["file2"]);
		});

		test("на конкретном коммите", async () => {
			expect(await gitfp.readdir(new Path(`:commit-${oid}`))).toEqual(
				expect.arrayContaining(["file", "dir", "to-be-deleted"]),
			);
			expect(await gitfp.readdir(new Path(`:commit-${oid}/dir`))).toEqual(["file2"]);
		});

		test("на ветке master", async () => {
			expect(await gitfp.readdir(new Path(":master"))).toEqual(expect.arrayContaining(["file", "dir"]));
			expect(await gitfp.readdir(new Path(":master/dir"))).toEqual(["file2"]);
		});
	});

	describe("проверяет существование файла", () => {
		test("на хеде", async () => {
			expect(await gitfp.exists(new Path("file"))).toBe(true);
			expect(await gitfp.exists(new Path("dir"))).toBe(true);
			expect(await gitfp.exists(new Path("dir/file2"))).toBe(true);
			expect(await gitfp.exists(new Path("not-exists"))).toBe(false);
			expect(await gitfp.exists(new Path("to-be-deleted"))).toBe(false);
		});

		test("на конкретном коммите", async () => {
			expect(await gitfp.exists(new Path(`:commit-${oid}/file`))).toBe(true);
			expect(await gitfp.exists(new Path(`:commit-${oid}/dir`))).toBe(true);
			expect(await gitfp.exists(new Path(`:commit-${oid}/dir/file2`))).toBe(true);
			expect(await gitfp.exists(new Path(`:commit-${oid}/to-be-deleted`))).toBe(true);
			expect(await gitfp.exists(new Path(`:commit-${oid}/not-exists`))).toBe(false);
		});

		test("на ветке master", async () => {
			expect(await gitfp.exists(new Path(":master/file"))).toBe(true);
			expect(await gitfp.exists(new Path(":master/dir"))).toBe(true);
			expect(await gitfp.exists(new Path(":master/dir/file2"))).toBe(true);
			expect(await gitfp.exists(new Path(":master/to-be-deleted"))).toBe(false);
			expect(await gitfp.exists(new Path(":master/not-exists"))).toBe(false);
		});
	});

	describe("получает stat файла", () => {
		test("на хеде", async () => {
			const fileStat = await gitfp.getStat(new Path("file"));
			expect(fileStat.isFile()).toBe(true);
			expect(fileStat.isDirectory()).toBe(false);
			expect(fileStat.size).toBeGreaterThan(0);

			const dirStat = await gitfp.getStat(new Path("dir"));
			expect(dirStat.isFile()).toBe(false);
			expect(dirStat.isDirectory()).toBe(true);
		});

		test("на конкретном коммите", async () => {
			const fileStat = await gitfp.getStat(new Path(`:commit-${oid}/file`));
			expect(fileStat.isFile()).toBe(true);
			expect(fileStat.isDirectory()).toBe(false);
			expect(fileStat.size).toBeGreaterThan(0);

			const dirStat = await gitfp.getStat(new Path(`:commit-${oid}/dir`));
			expect(dirStat.isFile()).toBe(false);
			expect(dirStat.isDirectory()).toBe(true);

			const deletedFileStat = await gitfp.getStat(new Path(`:commit-${oid}/to-be-deleted`));
			expect(deletedFileStat.isFile()).toBe(true);
			expect(deletedFileStat.isDirectory()).toBe(false);
			expect(deletedFileStat.size).toBe(0);
		});

		test("на ветке master", async () => {
			const fileStat = await gitfp.getStat(new Path(":master/file"));
			expect(fileStat.isFile()).toBe(true);
			expect(fileStat.isDirectory()).toBe(false);
			expect(fileStat.size).toBeGreaterThan(0);

			const dirStat = await gitfp.getStat(new Path(":master/dir"));
			expect(dirStat.isFile()).toBe(false);
			expect(dirStat.isDirectory()).toBe(true);
		});

		test("выбрасывает ошибку для несуществующего файла", async () => {
			await expect(gitfp.getStat(new Path("non-existent"))).rejects.toThrow();
			await expect(gitfp.getStat(new Path(":master/non-existent"))).rejects.toThrow();
		});
	});
});
