import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import fixMerge from "@ext/git/actions/MergeConflictHandler/logic/FixConflictLibgit2";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};

const dfp = new DiskFileProvider(__dirname);
let git: GitCommands;

describe("Fix Addition Conflict Libgit2 фиксит конфликт", () => {
	beforeEach(async () => {
		await dfp.mkdir(path("testRep"));
		await dfp.mkdir(repPath("folder"));
		await GitVersionControl.init(dfp, path("testRep"), mockUserData);
		git = new GitCommands(dfp, path("testRep"));
		await dfp.write(repPath("1.txt"), "init");
		await dfp.write(repPath("folder/1.txt"), "init");
		await git.add(), await git.commit("init", mockUserData);
	});

	afterEach(async () => {
		await dfp.delete(path("testRep"));
		await RepositoryProvider.invalidateRepoCache([]);
		git = null;
	});

	describe("мерж конфликт", () => {
		test("контент конфликтных файлов отличается", async () => {
			await dfp.write(repPath("2.txt"), "2.txt content");
			await dfp.write(repPath("1.txt~ours"), "ours");
			await dfp.write(repPath("1.txt~theirs"), "theirs");
			await dfp.write(repPath("folder/1.txt~ours"), "ours");
			await dfp.write(repPath("folder/1.txt~theirs"), "theirs");

			const newMergeResult = await fixMerge(
				[
					{ ancestor: null, ours: "1.txt", theirs: "1.txt" },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
					{ ancestor: null, ours: "folder/1.txt", theirs: "folder/1.txt" },
				],
				dfp,
				path("testRep"),
				git,
				null,
				null,
			);

			expect(newMergeResult).toEqual([
				{ ancestor: null, ours: "1.txt", theirs: "1.txt" },
				{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
				{ ancestor: null, ours: "folder/1.txt", theirs: "folder/1.txt" },
			]);

			expect(await dfp.exists(repPath("1.txt~ours"))).toBeFalsy();
			expect(await dfp.exists(repPath("1.txt~theirs"))).toBeFalsy();

			expect(await dfp.exists(repPath("folder/1.txt~ours"))).toBeFalsy();
			expect(await dfp.exists(repPath("folder/1.txt~theirs"))).toBeFalsy();

			expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
			expect(await dfp.exists(repPath("folder/1.txt"))).toBeTruthy();

			expect(await dfp.read(repPath("1.txt"))).toBe("<<<<<<< ours\nours\n=======\ntheirs\n>>>>>>> theirs\n");
			expect(await dfp.read(repPath("folder/1.txt"))).toBe(
				"<<<<<<< ours\nours\n=======\ntheirs\n>>>>>>> theirs\n",
			);
		});
		test("контент конфликтных файлов не отличается", async () => {
			await dfp.write(repPath("2.txt"), "2.txt content");
			await dfp.write(repPath("1.txt~ours"), "common");
			await dfp.write(repPath("1.txt~theirs"), "common");
			await dfp.write(repPath("folder/1.txt~ours"), "common");
			await dfp.write(repPath("folder/1.txt~theirs"), "common");

			const newMergeResult = await fixMerge(
				[
					{ ancestor: null, ours: "1.txt", theirs: "1.txt" },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
					{ ancestor: null, ours: "folder/1.txt", theirs: "folder/1.txt" },
				],
				dfp,
				path("testRep"),
				git,
				null,
				null,
			);

			expect(newMergeResult).toEqual([{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" }]);

			expect(await dfp.exists(repPath("1.txt~ours"))).toBeFalsy();
			expect(await dfp.exists(repPath("1.txt~theirs"))).toBeFalsy();

			expect(await dfp.exists(repPath("folder/1.txt~ours"))).toBeFalsy();
			expect(await dfp.exists(repPath("folder/1.txt~theirs"))).toBeFalsy();

			expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
			expect(await dfp.exists(repPath("folder/1.txt"))).toBeTruthy();

			expect(await dfp.read(repPath("1.txt"))).toBe("common");
			expect(await dfp.read(repPath("folder/1.txt"))).toBe("common");
		});
	});
	describe("стеш конфликт", () => {
		test("контент конфликтных файлов отличается", async () => {
			await dfp.write(repPath("2.txt"), "2.txt content");
			await dfp.write(repPath("1.txt~Updated upstream"), "ours");
			await dfp.write(repPath("1.txt~Stashed changes"), "theirs");
			await dfp.write(repPath("folder/1.txt~Updated upstream"), "ours");
			await dfp.write(repPath("folder/1.txt~Stashed changes"), "theirs");

			const newMergeResult = await fixMerge(
				[
					{ ancestor: null, ours: "1.txt", theirs: "1.txt" },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },

					{ ancestor: null, ours: "folder/1.txt", theirs: "folder/1.txt" },
				],
				dfp,
				path("testRep"),
				git,
				null,
				null,
			);

			expect(newMergeResult).toEqual([
				{ ancestor: null, ours: "1.txt", theirs: "1.txt" },
				{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },

				{ ancestor: null, ours: "folder/1.txt", theirs: "folder/1.txt" },
			]);

			expect(await dfp.exists(repPath("1.txt~Updated upstream"))).toBeFalsy();
			expect(await dfp.exists(repPath("1.txt~Stashed changes"))).toBeFalsy();

			expect(await dfp.exists(repPath("folder/1.txt~Updated upstream"))).toBeFalsy();
			expect(await dfp.exists(repPath("folder/1.txt~Stashed changes"))).toBeFalsy();

			expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
			expect(await dfp.exists(repPath("folder/1.txt"))).toBeTruthy();

			expect(await dfp.read(repPath("1.txt"))).toBe(
				"<<<<<<< Updated upstream\nours\n=======\ntheirs\n>>>>>>> Stashed changes\n",
			);
			expect(await dfp.read(repPath("folder/1.txt"))).toBe(
				"<<<<<<< Updated upstream\nours\n=======\ntheirs\n>>>>>>> Stashed changes\n",
			);
		});
		test("контент конфликтных файлов не отличается", async () => {
			await dfp.write(repPath("2.txt"), "2.txt content");
			await dfp.write(repPath("1.txt~Updated upstream"), "common");
			await dfp.write(repPath("1.txt~Stashed changes"), "common");
			await dfp.write(repPath("folder/1.txt~Updated upstream"), "common");
			await dfp.write(repPath("folder/1.txt~Stashed changes"), "common");

			const newMergeResult = await fixMerge(
				[
					{ ancestor: null, ours: "1.txt", theirs: "1.txt" },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },

					{ ancestor: null, ours: "folder/1.txt", theirs: "folder/1.txt" },
				],
				dfp,
				path("testRep"),
				git,
				null,
				null,
			);

			expect(newMergeResult).toEqual([{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" }]);

			expect(await dfp.exists(repPath("1.txt~Updated upstream"))).toBeFalsy();
			expect(await dfp.exists(repPath("1.txt~Stashed changes"))).toBeFalsy();

			expect(await dfp.exists(repPath("folder/1.txt~Updated upstream"))).toBeFalsy();
			expect(await dfp.exists(repPath("folder/1.txt~Stashed changes"))).toBeFalsy();

			expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
			expect(await dfp.exists(repPath("folder/1.txt"))).toBeTruthy();

			expect(await dfp.read(repPath("1.txt"))).toBe("common");
			expect(await dfp.read(repPath("folder/1.txt"))).toBe("common");
		});
	});
	test("непраильный статус файла", async () => {
		await dfp.write(repPath("1.txt"), "<<<<<<< Updated upstream\nours\n=======\ntheirs\n>>>>>>> Stashed changes\n");

		const newMergeResult = await fixMerge(
			[
				{ ancestor: null, ours: "1.txt", theirs: null },
				{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
			],
			dfp,
			path("testRep"),
			git,
			null,
			null,
		);

		expect(newMergeResult).toEqual([
			{ ancestor: null, ours: "1.txt", theirs: "1.txt" },
			{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
		]);
	});
	describe("восстанавливает контент удаленного по ошибке файла", () => {
		test("добавлен у нас", async () => {
			await dfp.delete(repPath("1.txt"));
			const newMergeResult = await fixMerge(
				[
					{ ancestor: null, ours: "1.txt", theirs: null },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
				],
				dfp,
				path("testRep"),
				git,
				await git.getHeadCommit(),
				null,
			);
			expect(await dfp.read(repPath("1.txt"))).toBe("init");
			expect(newMergeResult).toEqual([
				{ ancestor: null, ours: "1.txt", theirs: null },
				{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
			]);
		});
		test("добавлен у них", async () => {
			await dfp.delete(repPath("1.txt"));
			const newMergeResult = await fixMerge(
				[
					{ ancestor: null, ours: null, theirs: "1.txt" },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
				],
				dfp,
				path("testRep"),
				git,
				null,
				await git.getHeadCommit(),
			);
			expect(await dfp.read(repPath("1.txt"))).toBe("init");
			expect(newMergeResult).toEqual([
				{ ancestor: null, ours: null, theirs: "1.txt" },
				{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
			]);
		});
		test("удален у нас", async () => {
			await dfp.delete(repPath("1.txt"));
			const newMergeResult = await fixMerge(
				[
					{ ancestor: "1.txt", ours: null, theirs: "1.txt" },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
				],
				dfp,
				path("testRep"),
				git,
				null,
				await git.getHeadCommit(),
			);
			expect(await dfp.read(repPath("1.txt"))).toBe("init");
			expect(newMergeResult).toEqual([
				{ ancestor: "1.txt", ours: null, theirs: "1.txt" },
				{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
			]);
		});
		test("удален у них", async () => {
			await dfp.delete(repPath("1.txt"));
			const newMergeResult = await fixMerge(
				[
					{ ancestor: "1.txt", ours: null, theirs: "1.txt" },
					{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
				],
				dfp,
				path("testRep"),
				git,
				null,
				await git.getHeadCommit(),
			);
			expect(await dfp.read(repPath("1.txt"))).toBe("init");
			expect(newMergeResult).toEqual([
				{ ancestor: "1.txt", ours: null, theirs: "1.txt" },
				{ ancestor: null, ours: "some-file.txt", theirs: "some-file.txt" },
			]);
		});
	});
});
