import Path from "./Path";

describe("Path правильно", () => {
	describe("выдает", () => {
		const testPaths = [
			new Path("folder/file.extention0"),
			new Path("/folder/file.extention0"),
			new Path("./folder/file.extention1"),
			new Path("../folder/file.extention2"),
			new Path(".../folder/file.extention3"),
			new Path("rootFolder/folder1/folder2"),
			new Path("docs/bi/3.Subsystems Architecture/eCompass_Export"),
			new Path("/docs/bi/3.Subsystems Architecture/eCompass_Export"),
			new Path("./docs/bi/3.Subsystems Architecture/eCompass_Export"),
			new Path("../docs/bi/3.Subsystems Architecture/eCompass_Export"),
			new Path(".../docs/bi/3.Subsystems Architecture/eCompass_Export"),
		];

		describe("родительскую директорию", () => {
			const testParentDirectoryPaths = [
				new Path("folder"),
				new Path("/folder"),
				new Path("./folder"),
				new Path("../folder"),
				new Path(".../folder"),
				new Path("rootFolder/folder1"),
				new Path("docs/bi/3.Subsystems Architecture"),
				new Path("/docs/bi/3.Subsystems Architecture"),
				new Path("./docs/bi/3.Subsystems Architecture"),
				new Path("../docs/bi/3.Subsystems Architecture"),
				new Path(".../docs/bi/3.Subsystems Architecture"),
			];

			testPaths.forEach((path, idx) => {
				test(`для ${path} => ${testParentDirectoryPaths[idx]}`, () => {
					expect(path.parentDirectoryPath).toEqual(testParentDirectoryPaths[idx]);
				});
			});
		});

		describe("путь без расширения", () => {
			const testPaths = [
				new Path("folder.md"),
				new Path("./folder.md"),
				new Path("../folder.md"),
				new Path(".../folder.md"),
				new Path("rootFolder/folder1.md"),
			];

			const testStripExtension = ["folder", "./folder", "../folder", ".../folder", "rootFolder/folder1"];

			testPaths.forEach((path, idx) => {
				test(`с ${idx} точками в начале`, () => {
					expect(path.stripExtension).toEqual(testStripExtension[idx]);
				});
			});
		});

		describe("путь без точек и расширения", () => {
			const testPaths = [
				new Path("folder.md"),
				new Path("./folder.md"),
				new Path("../folder.md"),
				new Path(".../folder.md"),
				new Path("rootFolder/folder1.md"),
			];

			const testStripExtension = ["folder", "/folder", "/folder", "/folder", "rootFolder/folder1"];

			testPaths.forEach((path, idx) => {
				test(`с ${idx} точками в начале`, () => {
					expect(path.stripDotsAndExtension).toEqual(testStripExtension[idx]);
				});
			});
		});

		describe("расширение", () => {
			const extentions = [
				"extention0",
				"extention0",
				"extention1",
				"extention2",
				"extention3",
				null,
				null,
				null,
				null,
				null,
				null,
			];

			testPaths.forEach((path, idx) => {
				test(`для ${path} => ${extentions[idx]}`, () => {
					expect(path.extension).toEqual(extentions[idx]);
				});
			});
		});

		describe("все расширения", () => {
			const path = [
				new Path("rootFolder/folder/file.comment.yaml"),
				new Path("/rootFolder/folder/file.comment.yaml"),
				new Path("./rootFolder/folder/file.comment.yaml"),
				new Path("../rootFolder/folder/file.comment.yaml"),
				new Path(".../rootFolder/folder/file.comment.yaml"),
			];
			const res = ["comment", "yaml"];

			path.forEach((path) => {
				test(`для ${path} => ${res}`, () => {
					expect(path.allExtensions).toEqual(res);
				});
			});
		});

		describe("путь до корневой папки", () => {
			const rootDirectoryPaths = [
				new Path("folder"),
				new Path("/folder"),
				new Path("./folder"),
				new Path("../folder"),
				new Path(".../folder"),
				new Path("rootFolder"),
				new Path("docs"),
				new Path("/docs"),
				new Path("./docs"),
				new Path("../docs"),
				new Path(".../docs"),
			];

			testPaths.forEach((path, idx) => {
				test(`для ${path} => ${rootDirectoryPaths[idx]}`, () => {
					expect(path.rootDirectory).toEqual(rootDirectoryPaths[idx]);
				});
			});
		});

		describe("путь относительно", () => {
			const testPath = new Path("rootFolder/folder1/forlder2/folder3/file");

			test(`rootFolder`, () => {
				const rootPath = new Path("rootFolder");
				expect(rootPath.getRelativePath(testPath)).toEqual(
					new Path("./../rootFolder/folder1/forlder2/folder3/file"),
				);
			});

			test(`rootFolder/folder1`, () => {
				const rootPath = new Path("rootFolder/folder1");
				expect(rootPath.getRelativePath(testPath)).toEqual(new Path("./../folder1/forlder2/folder3/file"));
			});

			test(`rootFolder/folder1/forlder2`, () => {
				const rootPath = new Path("rootFolder/folder1/forlder2");
				expect(rootPath.getRelativePath(testPath)).toEqual(new Path("./../forlder2/folder3/file"));
			});

			test(`rootFolder/folder1/file.ext`, () => {
				const rootPath = new Path("rootFolder/folder1/file.ext");
				expect(rootPath.getRelativePath(testPath)).toEqual(new Path("./forlder2/folder3/file"));
			});
		});
	});

	describe("соединяет", () => {
		const rootPaths = [
			new Path("rootFolder"),
			new Path("/rootFolder"),
			new Path("./rootFolder"),
			new Path("../rootFolder"),
			new Path("rootFolder/folder1/folder2"),
			new Path("rootFolder/folder.1/folder2"),
			new Path("rootFolder/folder 1/folder2"),
			new Path("rootFolder/1.folder 1/folder2"),
			new Path("/rootFolder/folder1/folder2"),
			new Path("./rootFolder/folder1/folder2"),
			new Path("../rootFolder/folder1/folder2"),
		];

		describe("обычный путь", () => {
			const joinPath = new Path("folder/file.ext");

			const resultPaths = [
				new Path("rootFolder/folder/file.ext"),
				new Path("/rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("../rootFolder/folder/file.ext"),
				new Path("rootFolder/folder1/folder2/folder/file.ext"),
				new Path("rootFolder/folder.1/folder2/folder/file.ext"),
				new Path("rootFolder/folder 1/folder2/folder/file.ext"),
				new Path("rootFolder/1.folder 1/folder2/folder/file.ext"),
				new Path("/rootFolder/folder1/folder2/folder/file.ext"),
				new Path("rootFolder/folder1/folder2/folder/file.ext"),
				new Path("../rootFolder/folder1/folder2/folder/file.ext"),
			];

			rootPaths.forEach((p, idx) => {
				describe(`'${p.value}' и ${joinPath} => ${resultPaths[idx]}`, () => {
					test(`обычный 'join'`, () => {
						expect(p.join(joinPath)).toEqual(resultPaths[idx]);
					});
					test(`статический 'join'`, () => {
						expect(Path.join(p.value, joinPath.value)).toEqual(resultPaths[idx].value);
					});
				});
			});
		});

		describe("путь с точкой", () => {
			const joinPath = new Path("./folder/file.ext");

			const resultPaths = [
				new Path("rootFolder/folder/file.ext"),
				new Path("/rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("../rootFolder/folder/file.ext"),
				new Path("rootFolder/folder1/folder2/folder/file.ext"),
				new Path("rootFolder/folder.1/folder2/folder/file.ext"),
				new Path("rootFolder/folder 1/folder2/folder/file.ext"),
				new Path("rootFolder/1.folder 1/folder2/folder/file.ext"),
				new Path("/rootFolder/folder1/folder2/folder/file.ext"),
				new Path("rootFolder/folder1/folder2/folder/file.ext"),
				new Path("../rootFolder/folder1/folder2/folder/file.ext"),
			];

			rootPaths.forEach((p, idx) => {
				describe(`'${p.value}' и ${joinPath} => ${resultPaths[idx]}`, () => {
					test(`обычный 'join'`, () => {
						expect(p.join(joinPath)).toEqual(resultPaths[idx]);
					});
					test(`статический 'join'`, () => {
						expect(Path.join(p.value, joinPath.value)).toEqual(resultPaths[idx].value);
					});
				});
			});
		});

		describe("путь с двоеточием", () => {
			const joinPath = new Path("../folder/file.ext");

			const resultPaths = [
				new Path("folder/file.ext"),
				new Path("/folder/file.ext"),
				new Path("folder/file.ext"),
				new Path("../folder/file.ext"),
				new Path("rootFolder/folder1/folder/file.ext"),
				new Path("rootFolder/folder.1/folder/file.ext"),
				new Path("rootFolder/folder 1/folder/file.ext"),
				new Path("rootFolder/1.folder 1/folder/file.ext"),
				new Path("/rootFolder/folder1/folder/file.ext"),
				new Path("rootFolder/folder1/folder/file.ext"),
				new Path("../rootFolder/folder1/folder/file.ext"),
			];

			rootPaths.forEach((p, idx) => {
				describe(`'${p.value}' и ${joinPath} => ${resultPaths[idx]}`, () => {
					test(`обычный 'join'`, () => {
						expect(p.join(joinPath)).toEqual(resultPaths[idx]);
					});
					test(`статический 'join'`, () => {
						expect(Path.join(p.value, joinPath.value)).toEqual(resultPaths[idx].value);
					});
				});
			});
		});

		describe("путь с троеточием", () => {
			const joinPath = new Path(".../folder/file.ext");

			const resultPaths = [
				new Path("rootFolder/folder/file.ext"),
				new Path("/rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("../rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("/rootFolder/folder/file.ext"),
				new Path("rootFolder/folder/file.ext"),
				new Path("../rootFolder/folder/file.ext"),
			];

			rootPaths.forEach((p, idx) => {
				describe(`'${p.value}' и ${joinPath} => ${resultPaths[idx]}`, () => {
					test(`обычный 'join'`, () => {
						expect(p.join(joinPath)).toEqual(resultPaths[idx]);
					});
					test(`статический 'join'`, () => {
						expect(Path.join(p.value, joinPath.value)).toEqual(resultPaths[idx].value);
					});
				});
			});
		});

		const rootPath = new Path("/docs/bi/3.Subsystems Architecture/eCompass_Export");
		const joinPath = new Path(".../bi/6.DWH/eCompass_Export/Products/_index.md");

		const resultPath = new Path("/docs/bi/6.DWH/eCompass_Export/Products/_index.md");

		describe("/docs/bi/3.Subsystems Architecture/eCompass_Export and .../bi/6.DWH/eCompass_Export/Products/_index.md => docs/bi/6.DWH/eCompass_Export/Products/_index.md", () => {
			test("обычный 'join'", () => {
				expect(rootPath.join(joinPath)).toEqual(resultPath);
			});
			test("статический 'join'", () => {
				expect(Path.join(rootPath.value, joinPath.value)).toEqual(resultPath.value);
			});
		});
	});

	describe("сравнивает", () => {
		describe("пути в текущей директории", () => {
			const path = new Path("rootFolder/folder/file.ext");

			test(`с точкой в начале`, () => {
				const p = new Path("./rootFolder/folder/file.ext");
				expect(p.compare(path)).toEqual(true);
			});

			test(`с слешем в начале`, () => {
				const p = new Path("/rootFolder/folder/file.ext");
				expect(p.compare(path)).toEqual(true);
			});

			test(`без ничего в начале`, () => {
				const p = new Path("rootFolder/folder/file.ext");
				expect(p.compare(path)).toEqual(true);
			});
		});

		test("пути до родительской директории", () => {
			const path = new Path("../rootFolder/folder/file.ext");
			const comparePaths = new Path("../rootFolder/folder/file.ext");
			expect(comparePaths.compare(path)).toEqual(true);
		});

		test("пути до корневой директории", () => {
			const path = new Path(".../rootFolder/folder/file.ext");
			const comparePaths = new Path(".../rootFolder/folder/file.ext");
			expect(comparePaths.compare(path)).toEqual(true);
		});
	});
	describe("отрезает", () => {
		test("путь", () => {
			const path = new Path("rootFolder/folder/file.ext");
			const res = new Path("rootFolder").subDirectory(path);
			expect(res).toEqual(new Path("/folder/file.ext"));
		});
	});
});