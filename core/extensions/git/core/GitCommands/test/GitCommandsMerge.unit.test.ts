/**
 * @jest-environment node
 */

import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
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

		await git.createNewBranch("A");
		await git.createNewBranch("B");
	});

	afterEach(async () => {
		await dfp.delete(path("testRep"));
		git = null;
	});

	describe("Мержит с конфилктом", () => {
		describe("Модификация и", () => {
			test("модификация", async () => {
				const fileA = await writeFile("1.txt", "content B\nline 2\nline 3");
				await git.add([fileA]), await git.commit("", mockUserData);

				await git.checkout("A");
				const fileB = await writeFile("1.txt", "content A\nline 2\nline 3");
				await git.add([fileB]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(await dfp.read(repPath("1.txt"))).toBe(
					"<<<<<<< ours\ncontent A\n=======\ncontent B\n>>>>>>> theirs\nline 2\nline 3",
				);
				expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: "1.txt", theirs: "1.txt" }]);
			});
			describe("удаление", () => {
				test("файл удален в ветке A и модифицирован в ветке B ", async () => {
					const fileA = await writeFile("1.txt", "content B\nline 2\nline 3");
					await git.add([fileA]), await git.commit("", mockUserData);

					await git.checkout("A");
					await dfp.delete(repPath("1.txt"));
					await git.add([path("1.txt")]), await git.commit("", mockUserData);

					const conflictFiles = await git.merge(mockUserData, "B");

					expect(await dfp.read(repPath("1.txt"))).toBe("content B\nline 2\nline 3");
					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: null, theirs: "1.txt" }]);
				});
				test("файл удален в ветке B и модифицирован в ветке A ", async () => {
					await dfp.delete(repPath("1.txt"));
					await git.add([path("1.txt")]), await git.commit("", mockUserData);

					await git.checkout("A");
					const fileA = await writeFile("1.txt", "content A\nline 2\nline 3");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.merge(mockUserData, "B");

					expect(await dfp.read(repPath("1.txt"))).toBe("content A\nline 2\nline 3");
					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: "1.txt", theirs: null }]);
				});
			});
			describe("переименование с модификацией", () => {
				test("файл модифицирован в ветке A и переименован с модификацией в ветке B", async () => {
					await dfp.move(repPath("1.txt"), repPath("2.txt"));
					await writeFile("2.txt", "content B\nline 2\nline 3");
					await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

					await git.checkout("A");
					const fileA = await writeFile("1.txt", "content A\nline2\nline3");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.merge(mockUserData, "B");

					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: "1.txt", theirs: null }]);
					expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
				});
				test("файл модифицирован в ветке B и переименован с модификацией в ветке A", async () => {
					const fileA = await writeFile("1.txt", "content B\nline2\nline3");
					await git.add([fileA]), await git.commit("", mockUserData);

					await git.checkout("A");
					await dfp.move(repPath("1.txt"), repPath("2.txt"));
					await writeFile("2.txt", "content A\nline 2\nline 3");
					await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

					const conflictFiles = await git.merge(mockUserData, "B");

					expect(conflictFiles).toEqual([{ ancestor: "1.txt", ours: null, theirs: "1.txt" }]);
					expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
				});
			});
		});

		describe("Удаление и переименование", () => {
			test("файл удален в ветке A и переименован в ветке B", async () => {
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				await git.checkout("A");
				await dfp.delete(repPath("1.txt"));
				await git.add([path("1.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(conflictFiles.length).toBe(2);
				expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: null, theirs: "2.txt" });
				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
			});
			test("файл удален в ветке B и переименован в ветке A", async () => {
				await dfp.delete(repPath("1.txt"));
				await git.add([path("1.txt")]), await git.commit("", mockUserData);

				await git.checkout("A");
				await dfp.move(repPath("1.txt"), repPath("1_moved.txt"));
				await git.add([path("1.txt"), path("1_moved.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
				expect(conflictFiles.length).toBe(2);
				expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: "1_moved.txt", theirs: null });
			});
		});

		describe("Добавление и", () => {
			describe("добавление", () => {
				test("котент совпадает больше 50%", async () => {
					const fileB = await writeFile("2.txt", "content B\nline 2\nline 3");
					await git.add([fileB]), await git.commit("", mockUserData);

					await git.checkout("A");
					const fileA = await writeFile("2.txt", "content A\nline 2\nline 3");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.merge(mockUserData, "B");

					expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
					expect(await dfp.read(repPath("2.txt"))).toBe(
						"<<<<<<< ours\ncontent A\n=======\ncontent B\n>>>>>>> theirs\nline 2\nline 3",
					);
				});
				test("котент совпадает меньше 50%", async () => {
					const fileB = await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
					await git.add([fileB]), await git.commit("", mockUserData);

					await git.checkout("A");
					const fileA = await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
					await git.add([fileA]), await git.commit("", mockUserData);

					const conflictFiles = await git.merge(mockUserData, "B");

					expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
					expect(await dfp.read(repPath("2.txt"))).toBe(
						"<<<<<<< ours\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> theirs\n",
					);
				});
			});
			describe("переименование", () => {
				describe("контент совпадает больше 50%", () => {
					test("файл добавлен в ветке A и переименован в ветке B", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						await git.checkout("A");
						const fileA = await writeFile("2.txt", "content A\nline 2\nline 3");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");
						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: "1.txt", theirs: null });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\ncontent A\nline 2\nline 3\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> theirs\n",
						);
					});
					test("файл добавлен в ветке B и переименован в ветке A", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2\nline 3");
						await git.add([fileB]), await git.commit("", mockUserData);

						await git.checkout("A");
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: "1.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2\nline 3\n>>>>>>> theirs\n",
						);
					});
				});
				describe("контент совпадает меньше 50%", () => {
					test("файл добавлен в ветке A и переименован в ветке B", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						await git.checkout("A");
						const fileA = await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: "1.txt", theirs: null });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\ncontent A\nline 2 A\nline 3 A\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> theirs\n",
						);
					});
					test("файл добавлен в ветке B и переименован в ветке A", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
						await git.add([fileB]), await git.commit("", mockUserData);

						await git.checkout("A");
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: "1.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeTruthy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> theirs\n",
						);
					});
				});
			});
			describe("переименование с модификацией", () => {
				describe("контент совпадает больше 50%", () => {
					test("файл добавлен в ветке A и переименован с модификацией в ветке B", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content B\nline 2\nline 3");
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						await git.checkout("A");
						const fileA = await writeFile("2.txt", "content A\nline 2\nline 3");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\ncontent A\n=======\ncontent B\n>>>>>>> theirs\nline 2\nline 3",
						);
					});
					test("файл добавлен в ветке B и переименован с модификацией в ветке A", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2\nline 3");
						await git.add([fileB]), await git.commit("", mockUserData);

						await git.checkout("A");
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content A\nline 2\nline 3");
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\ncontent A\n=======\ncontent B\n>>>>>>> theirs\nline 2\nline 3",
						);
					});
				});
				describe("контент совпадает меньше 50%", () => {
					test("файл добавлен в ветке A и переименован с модификацией в ветке B", async () => {
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						await git.checkout("A");
						const fileA = await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
						await git.add([fileA]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> theirs\n",
						);
					});
					test("файл добавлен в ветке B и переименован с модификацией в ветке A", async () => {
						const fileB = await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
						await git.add([fileB]), await git.commit("", mockUserData);

						await git.checkout("A");
						await dfp.move(repPath("1.txt"), repPath("2.txt"));
						await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
						await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

						const conflictFiles = await git.merge(mockUserData, "B");

						expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
						expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
						expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
						expect(await dfp.read(repPath("2.txt"))).toEqual(
							"<<<<<<< ours\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> theirs\n",
						);
					});
				});
			});
		});

		describe("Переименование и", () => {
			test("переименование в разные файлы", async () => {
				await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
				await git.add([path("1.txt"), path("2_B.txt")]), await git.commit("", mockUserData);

				await git.checkout("A");
				await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
				await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: null, theirs: "2_B.txt" });
				expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2_A.txt", theirs: null });
			});
			describe("переименование с модификацией", () => {
				describe("переименованы в один и тот же файл", () => {
					describe("контент совпадает больше 50%", () => {
						test("файл переименван в ветке A и переименован с модификацией в ветке B", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content B\nline 2\nline 3");
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< ours\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2\nline 3\n>>>>>>> theirs\n",
							);
						});
						test("файл переименван в ветке B и переименован с модификацией в ветке A", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content A\nline 2\nline 3");
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< ours\ncontent A\nline 2\nline 3\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> theirs\n",
							);
						});
					});
					describe("контент совпадает меньше 50%", () => {
						test("файл переименван в ветке A и переименован с модификацией в ветке B", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content B\nline 2 B\nline 3 B");
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< ours\n1.txt content\nline 2\nline 3\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> theirs\n",
							);
						});
						test("файл переименован в ветке B и переименован с модификацией в ветке A", async () => {
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2.txt"));
							await writeFile("2.txt", "content A\nline 2 A\nline 3 A");
							await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2.txt", theirs: "2.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
							expect(await dfp.read(repPath("2.txt"))).toEqual(
								"<<<<<<< ours\ncontent A\nline 2 A\nline 3 A\n=======\n1.txt content\nline 2\nline 3\n>>>>>>> theirs\n",
							);
						});
					});
				});
				describe("переименованы в разные файлы", () => {
					describe("контент совпадает больше 50%", () => {
						test("файл переименован в ветке A и переименован с модификацией в ветке B", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await writeFile("2_B.txt", "content B\nline 2\nline 3\n");
							await git.add([path("1.txt"), path("2_B.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2_A.txt", theirs: null });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2_A.txt"))).toBeTruthy();
							expect(await dfp.exists(repPath("2_B.txt"))).toBeTruthy();
						});
						test("файл переименован в ветке B и переименован с модификацией в ветке A", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await git.add([path("1.txt"), path("2_B.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await writeFile("2_A.txt", "content A\nline 2\nline 3\n");
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

							expect(conflictFiles).toContainEqual({ ancestor: null, ours: null, theirs: "2_B.txt" });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2_A.txt"))).toBeTruthy();
							expect(await dfp.exists(repPath("2_B.txt"))).toBeTruthy();
						});
					});
					describe("контент совпадает меньше 50%", () => {
						test("файл переименован в ветке A и переименован с модификацией в ветке B", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await writeFile("2_B.txt", "content B\nline 2 B\nline 3 B\n");
							await git.add([path("1.txt"), path("2_B.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

							expect(conflictFiles).toContainEqual({ ancestor: null, ours: "2_A.txt", theirs: null });
							expect(conflictFiles).toContainEqual({ ancestor: "1.txt", ours: null, theirs: null });
							expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
							expect(await dfp.exists(repPath("2_A.txt"))).toBeTruthy();
							expect(await dfp.exists(repPath("2_B.txt"))).toBeTruthy();
						});
						test("файл переименован в ветке B и переименован с модификацией в ветке A", async () => {
							await dfp.move(repPath("1.txt"), repPath("2_B.txt"));
							await git.add([path("1.txt"), path("2_B.txt")]), await git.commit("", mockUserData);

							await git.checkout("A");
							await dfp.move(repPath("1.txt"), repPath("2_A.txt"));
							await writeFile("2_A.txt", "content A\nline 2 A\nline 3 A\n");
							await git.add([path("1.txt"), path("2_A.txt")]), await git.commit("", mockUserData);

							const conflictFiles = await git.merge(mockUserData, "B");

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
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				await git.checkout("A");
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await writeFile("2.txt", "content A\nline 2\nline 3");
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
				expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
				expect(await dfp.read(repPath("2.txt"))).toEqual(
					"<<<<<<< ours\ncontent A\n=======\ncontent B\n>>>>>>> theirs\nline 2\nline 3",
				);
			});
			test("контент совпадает меньше 50%", async () => {
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await writeFile("2.txt", "content B\nline 2 B\nline 3 B\nline 4");
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				await git.checkout("A");
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await writeFile("2.txt", "content A\nline 2 A\nline 3 A\nline 4");
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(conflictFiles).toEqual([{ ancestor: null, ours: "2.txt", theirs: "2.txt" }]);
				expect(await dfp.exists(repPath("1.txt"))).toBeFalsy();
				expect(await dfp.exists(repPath("2.txt"))).toBeTruthy();
				expect(await dfp.read(repPath("2.txt"))).toEqual(
					"<<<<<<< ours\ncontent A\nline 2 A\nline 3 A\n=======\ncontent B\nline 2 B\nline 3 B\n>>>>>>> theirs\nline 4",
				);
			});
		});
	});
	describe("Мержит без конфликта", () => {
		describe("Добавление и переименование, контент совпадает", () => {
			test("файл добавлен в ветке A и переименован в ветке B", async () => {
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				await git.checkout("A");
				const fileA = await writeFile("2.txt", "1.txt content\nline 2\nline 3");
				await git.add([fileA]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(conflictFiles.length).toBeLessThan(2);
			});
			test("файл добавлен в ветке B и переименован в ветке A", async () => {
				const fileB = await writeFile("2.txt", "1.txt content\nline 2\nline 3");
				await git.add([fileB]), await git.commit("", mockUserData);

				await git.checkout("A");
				await dfp.move(repPath("1.txt"), repPath("2.txt"));
				await git.add([path("1.txt"), path("2.txt")]), await git.commit("", mockUserData);

				const conflictFiles = await git.merge(mockUserData, "B");

				expect(conflictFiles.length).toBeLessThan(2);
			});
		});
	});
});
