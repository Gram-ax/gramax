import { normalizePosix, normalizeWin } from "./normalize";

describe("normalize правильно нормализует пути", () => {
	const testPaths = [
		"folder//",
		"/folder//",
		"./folder//",
		"../folder//",
		".../folder//",
		"//folder//",
		"rootFolder//folder1//",
		"docs//bi//3.Subsystems Architecture//",
		"/docs//bi//3.Subsystems Architecture//",
		"./docs//bi//3.Subsystems Architecture//",
		"../docs//bi//3.Subsystems Architecture//",
		".../docs//bi/3.Subsystems Architecture//",
		"//docs//bi//3.Subsystems Architecture//",
		"folder\\\\",
		"\\folder\\\\",
		".\\folder\\\\",
		"..\\folder\\\\",
		"...\\folder\\\\",
		"\\\\folder\\\\",
		"rootFolder\\\\folder1\\\\",
		"docs\\\\bi\\\\3.Subsystems Architecture\\\\",
		"\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
		".\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
		"..\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
		"...\\docs\\\\bi\\3.Subsystems Architecture\\\\",
		"\\\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
	];

	describe("в win", () => {
		const result = [
			"folder\\",
			"\\folder\\",
			"folder\\",
			"..\\folder\\",
			"...\\folder\\",
			"\\folder\\",
			"rootFolder\\folder1\\",
			"docs\\bi\\3.Subsystems Architecture\\",
			"\\docs\\bi\\3.Subsystems Architecture\\",
			"docs\\bi\\3.Subsystems Architecture\\",
			"..\\docs\\bi\\3.Subsystems Architecture\\",
			"...\\docs\\bi\\3.Subsystems Architecture\\",
			"\\\\docs\\bi\\3.Subsystems Architecture\\",
			"folder\\",
			"\\folder\\",
			"folder\\",
			"..\\folder\\",
			"...\\folder\\",
			"\\folder\\",
			"rootFolder\\folder1\\",
			"docs\\bi\\3.Subsystems Architecture\\",
			"\\docs\\bi\\3.Subsystems Architecture\\",
			"docs\\bi\\3.Subsystems Architecture\\",
			"..\\docs\\bi\\3.Subsystems Architecture\\",
			"...\\docs\\bi\\3.Subsystems Architecture\\",
			"\\\\docs\\bi\\3.Subsystems Architecture\\",
		];

		testPaths.forEach((path, idx) => {
			test(`для ${path} => ${result[idx]}`, () => {
				expect(normalizeWin(path)).toEqual(result[idx]);
			});
		});
	});

	describe("в posix", () => {
		const result = [
			"folder/",
			"/folder/",
			"folder/",
			"../folder/",
			".../folder/",
			"/folder/",
			"rootFolder/folder1/",
			"docs/bi/3.Subsystems Architecture/",
			"/docs/bi/3.Subsystems Architecture/",
			"docs/bi/3.Subsystems Architecture/",
			"../docs/bi/3.Subsystems Architecture/",
			".../docs/bi/3.Subsystems Architecture/",
			"/docs/bi/3.Subsystems Architecture/",
			"folder\\\\",
			"\\folder\\\\",
			".\\folder\\\\",
			"..\\folder\\\\",
			"...\\folder\\\\",
			"\\\\folder\\\\",
			"rootFolder\\\\folder1\\\\",
			"docs\\\\bi\\\\3.Subsystems Architecture\\\\",
			"\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
			".\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
			"..\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
			"...\\docs\\\\bi\\3.Subsystems Architecture\\\\",
			"\\\\docs\\\\bi\\\\3.Subsystems Architecture\\\\",
		];

		testPaths.forEach((path, idx) => {
			test(`для ${path} => ${result[idx]}`, () => {
				expect(normalizePosix(path)).toEqual(result[idx]);
			});
		});
	});
});
