/**
 * @jest-environment node
 */

import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);

async function writeFile(path: string, content: string): Promise<Path> {
	await dfp.write(repPath(path), content);
	return new Path(path);
}

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};

const dfp = new DiskFileProvider(__dirname);
let git: GitCommands;

describe("GitCommands", () => {
	beforeEach(async () => {
		await dfp.mkdir(path("testRep"));
		await GitVersionControl.init(dfp, path("testRep"), mockUserData);
		git = new GitCommands(dfp, path("testRep"));
		const testFile = await writeFile("testFile", "testFile content");
		await git.add([testFile]), await git.commit("init", mockUserData);
		const file = await writeFile("1.txt", "1.txt content\nline 2\nline 3");
		await git.add([file]), await git.commit("init", mockUserData);
	});

	afterEach(async () => {
		await dfp.delete(path("testRep"));
		await RepositoryProvider.invalidateRepoCache([]);
		git = null;
	});

	describe("Мержит с конфилктом", () => {
		describe("Модификация и", () => {
			test("модификация", async () => {
				await writeFile("1.txt", "content B\nline 2\nline 3");
				await git.add([path("1.txt")]);
				const stashHash = await git.stash(mockUserData);

				const fileB = await writeFile("1.txt", "content A\nline 2\nline 3");
				await git.add([fileB]), await git.commit("", mockUserData);

				const conflictFiles = await git.applyStash(stashHash);

				expect(await dfp.read(repPath("1.txt"))).toBe(
					"<<<<<<< Updated upstream\ncontent A\n=======\ncontent B\n>>>>>>> Stashed changes\nline 2\nline 3",
				);
				expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: "1.txt", theirs: "1.txt" }]);
			});
			describe("удаление", () => {
				test("файл удален в хэде и модифицирован в стеше ", async () => {
					await writeFile("1.txt", "content B\nline 2\nline 3");
					await git.add([path("1.txt")]);
					const stashHash = await git.stash(mockUserData);

					await dfp.delete(repPath("1.txt"));
					await git.add([path("1.txt")]), await git.commit("", mockUserData);

					const conflictFiles = await git.applyStash(stashHash);

					expect(await dfp.read(repPath("1.txt"))).toBe("content B\nline 2\nline 3");
					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: null, theirs: "1.txt" }]);
				});
				test("файл удален в стеше и модифицирован в хэде ", async () => {
					await dfp.delete(repPath("1.txt"));
					await git.add([path("1.txt")]);
					const stashHash = await git.stash(mockUserData);

					const fileA = await writeFile("1.txt", "content A\nline 2\nline 3");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.applyStash(stashHash);

					expect(await dfp.read(repPath("1.txt"))).toBe("content A\nline 2\nline 3");
					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: "1.txt", theirs: null }]);
				});
			});
			describe("переименование с модификацией", () => {
				test("файл модифицирован в хэде и переименован с модификацией в стеше", async () => {
					await dfp.move(repPath("1.txt"), repPath("2.txt"));
					await writeFile("2.txt", "content B\nline 2\nline 3");
					await git.add([path("1.txt"), path("2.txt")]);
					const stashHash = await git.stash(mockUserData);

					const fileA = await writeFile("1.txt", "content A\nline2\nline3");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.applyStash(stashHash);

					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: "1.txt", theirs: null }]);
					expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
				});
				test("файл модифицирован в стеше и переименован с модификацией в хэде", async () => {
					await writeFile("1.txt", "content B\nline2\nline3");
					await git.add([path("1.txt")]);
					const stashHash = await git.stash(mockUserData);

					await dfp.move(repPath("1.txt"), repPath("2.txt"));
					await writeFile("2.txt", "content A\nline 2\nline 3");
					await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

					const conflictFiles = await git.applyStash(stashHash);

					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: null, theirs: "1.txt" }]);
					expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
				});
			});
		});

		describe("Удаление и переименование", () => {
			test("файл удален в хэде и переименован в стеше", async () => {
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await git.add([path("1.txt"), path("2.txt")]);
				const stashHash = await git.stash(mockUserData);

				await dfp.delete(repPath("1.txt"));
				await git.add([path("1.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.applyStash(stashHash);

				expect(conflictFiles.length).toBe(2);
				expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: null, theirs: "2.txt" });
				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
			});
			test("файл удален в стеше и переименован в хэде", async () => {
				await dfp.delete(repPath("1.txt"));
				await git.add([path("1.txt")]);
				const stashHash = await git.stash(mockUserData);

				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.applyStash(stashHash);

				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
				expect(conflictFiles.length).toBe(2);
				expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: null });
			});
		});

		describe("Добавление и", () => {
			describe("добавление", () => {
				test("котент совпадает больше 50%", async () => {
					const fileB = await writeFile("2.txt", "content B\nline 2\nline 3");
					await git.add([fileB]);
					const stashHash = await git.stash(mockUserData);

					const fileA = await writeFile("2.txt", "content A\nline 2\nline 3");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.applyStash(stashHash);

					expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
					expect(await dfp.read(repPath("2.txt"))).toBe(
						"<<<<<<< Updated upstream\ncontent A\n=======\ncontent B\n>>>>>>> Stashed changes\nline 2\nline 3",
					);
				});
				test("котент совпадает меньше 50%", async () => {
					const fileB = await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
					await git.add([fileB]);
					const stashHash = await git.stash(mockUserData);

					const fileA = await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.applyStash(stashHash);

					expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
					expect(await dfp.read(repPath("2.txt"))).toBe(
						"<<<<<<< Updated upstream\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> Stashed changes\n",
					);
				});
			});
			describe("переименование", () => {
				describe("контент полностью совпадает", () => {
					test("файл добавлен в хэде и переименован в стеше", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]);
						const stashHash = await git.stash(mockUserData);

						const fileA = await writeFile("2.txt", "1.txt content\nline 2\nline 3");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).not.toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: "1.txt", theirs: null });
						expect(await dfp.read(repPath("2.txt"))).toBe("1.txt content\nline 2\nline 3");
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
					});
					test("файл добавлен в стеше и переименован в хэде", async () => {
						await writeFile("2.txt", "1.txt content\nline 2\nline 3");
						await git.add([path("2.txt")]);
						const stashHash = await git.stash(mockUserData);

						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).not.toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: "1.txt" });
						expect(await dfp.read(repPath("2.txt"))).toBe("1.txt content\nline 2\nline 3");
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
					});
				});
				describe("контент совпадает больше 50%", () => {
					test("файл добавлен в хэде и переименован в стеше", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]);
						const stashHash = await git.stash(mockUserData);

						const fileA = await writeFile("2.txt", "content A\nline 2\nline 3");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: "1.txt", theirs: null });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\ncontent A\nline 2\nline 3\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> Stashed changes\n",
						);
					});
					test("файл добавлен в стеше и переименован в хэде", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2\nline 3");
						await git.add([fileB]);
						const stashHash = await git.stash(mockUserData);

						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: "1.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2\nline 3\n>>>>>>> Stashed changes\n",
						);
					});
				});
				describe("контент совпадает меньше 50%", () => {
					test("файл добавлен в хэде и переименован в стеше", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]);
						const stashHash = await git.stash(mockUserData);

						const fileA = await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: "1.txt", theirs: null });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\ncontent A\nline 2 A\nline 3 A\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> Stashed changes\n",
						);
					});
					test("файл добавлен в стеше и переименован в хэде", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
						await git.add([fileB]);
						const stashHash = await git.stash(mockUserData);

						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: "1.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> Stashed changes\n",
						);
					});
				});
			});
			describe("переименование с модификацией", () => {
				describe("контент совпадает больше 50%", () => {
					test("файл добавлен в хэде и переименован с модификацией в стеше", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content B\nline 2\nline 3");
						await git.add([path("1.txt"), path("2.txt")]);
						const stashHash = await git.stash(mockUserData);

						const fileA = await writeFile("2.txt", "content A\nline 2\nline 3");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\ncontent A\n=======\ncontent B\n>>>>>>> Stashed changes\nline 2\nline 3",
						);
					});
					test("файл добавлен в стеше и переименован с модификацией в хэде", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2\nline 3");
						await git.add([fileB]);
						const stashHash = await git.stash(mockUserData);

						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content A\nline 2\nline 3");
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\ncontent A\n=======\ncontent B\n>>>>>>> Stashed changes\nline 2\nline 3",
						);
					});
				});
				describe("контент совпадает меньше 50%", () => {
					test("файл добавлен в хэде и переименован с модификацией в стеше", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
						await git.add([path("1.txt"), path("2.txt")]);
						const stashHash = await git.stash(mockUserData);

						const fileA = await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> Stashed changes\n",
						);
					});
					test("файл добавлен в стеше и переименован с модификацией в хэде", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
						await git.add([fileB]);
						const stashHash = await git.stash(mockUserData);

						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.applyStash(stashHash);

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< Updated upstream\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> Stashed changes\n",
						);
					});
				});
			});
		});

		describe("Переименование и", () => {
			test("переименование в разные файлы", async () => {
				await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
				await git.add([path("1.txt"), path("2_B.txt")]);
				const stashHash = await git.stash(mockUserData);

				await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
				await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.applyStash(stashHash);

				expect(conflictFiles.length).toBe(3);
				expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2_A.txt", theirs: null });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: null, theirs: "2_B.txt" });
			});
			describe("переименование с модификацией", () => {
				describe("переименованы в один и тот же файл", () => {
					describe("контент совпадает больше 50%", () => {
						test("файл переименван в хэде и переименован с модификацией в стеше", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content B\nline 2\nline 3");
							await git.add([path("1.txt."), path("2.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< Updated upstream\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2\nline 3\n>>>>>>> Stashed changes\n",
							);
						});
						test("файл переименван в стеше и переименован с модификацией в хэде", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content A\nline 2\nline 3");
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< Updated upstream\ncontent A\nline 2\nline 3\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> Stashed changes\n",
							);
						});
					});
					describe("контент совпадает меньше 50%", () => {
						test("файл переименван в хэде и переименован с модификацией в стеше", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
							await git.add([path("1.txt"), path("2.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< Updated upstream\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> Stashed changes\n",
							);
						});
						test("файл переименован в стеше и переименован с модификацией в хэде", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< Updated upstream\ncontent A\nline 2 A\nline 3 A\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> Stashed changes\n",
							);
						});
					});
				});
				describe("переименованы в разные файлы", () => {
					describe("контент совпадает больше 50%", () => {
						test("файл переименован в хэде и переименован с модификацией в стеше", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await writeFile("2_B.txt", "content B\nline 2\nline 3\n");
							await git.add([path("1.txt"), path("2_B.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2_A.txt", theirs: null });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2_A.txt"))).toBeTruthy();
							expect(await dfp.exists(repPath("2_B.txt"))).toBeTruthy();
						});
						test("файл переименован в стеше и переименован с модификацией в хэде", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await git.add([path("1.txt"), path("2_B.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await writeFile("2_A.txt", "content A\nline 2\nline 3\n");
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: null, theirs: "2_B.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2_A.txt"))).toBeTruthy();
							expect(await dfp.exists(repPath("2_B.txt"))).toBeTruthy();
						});
					});
					describe("контент совпадает меньше 50%", () => {
						test("файл переименован в хэде и переименован с модификацией в стеше", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await writeFile("2_B.txt", "content B\nline 2 B\nline 3 B\n");
							await git.add([path("1.txt"), path("2_B.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2_A.txt", theirs: null });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2_A.txt"))).toBeTruthy();
							expect(await dfp.exists(repPath("2_B.txt"))).toBeTruthy();
						});
						test("файл переименован в стеше и переименован с модификацией в хэде", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await git.add([path("1.txt"), path("2_B.txt")]);
							const stashHash = await git.stash(mockUserData);

							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await writeFile("2_A.txt", "content A\nline 2 A\nline 3 A\n");
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.applyStash(stashHash);

							expect(conflictFiles.length).toBe(2);
							expect(conflictFiles).toContainEqual({ ancestor: null, ours: null, theirs: "2_B.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2_A.txt"))).toBeTruthy();
							expect(await dfp.exists(repPath("2_B.txt"))).toBeTruthy();
						});
					});
				});
			});
		});

		describe("Переименование с модификацией и переименование с модификацией, переименованы в один и тот же файл", () => {
			test("контент совпадает больше 50%", async () => {
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await writeFile("2.txt", "content B\nline 2\nline 3");
				await git.add([path("1.txt"), path("2.txt")]);
				const stashHash = await git.stash(mockUserData);

				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await writeFile("2.txt", "content A\nline 2\nline 3");
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.applyStash(stashHash);

				expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
				expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
				expect(await dfp.read(repPath("2.txt"))).toEqual(
					"<<<<<<< Updated upstream\ncontent A\n=======\ncontent B\n>>>>>>> Stashed changes\nline 2\nline 3",
				);
			});
			test("контент совпадает меньше 50%", async () => {
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await writeFile("2.txt", "content B\nline 2 B\nline 3 B\nline 4");
				await git.add([path("1.txt"), path("2.txt")]);
				const stashHash = await git.stash(mockUserData);

				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await writeFile("2.txt", "content A\nline 2 A\nline 3 A\nline 4");
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.applyStash(stashHash);

				expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
				expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
				expect(await dfp.read(repPath("2.txt"))).toEqual(
					"<<<<<<< Updated upstream\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> Stashed changes\nline 4",
				);
			});
		});
	});
});
