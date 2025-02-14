import fileNameUtils from "@core-ui/fileNameUtils";

describe("fileNameUtils умеет", () => {
	test("формировать название файла без расширения", () => {
		const baseFileName = "cknkcnk";
		const extension = null;
		const newName = "./cknkcnk-2";
		const namesExtensions = [
			"./.git",
			"./new-article-3",
			"./aaaa-2.png",
			"./aaaa-3.png",
			"./aaaa.mermaid",
			"./etyetytey-2.png",
			"./etyetytey.md",
			"./aaaa.svg",
			"./aaaa",
			"./cknkcnk",
			"./cknkcnk.svg",
			"./cknkcnk-3.svg",
			"./cknkcnk-2.svg",
			"./undefined.png",
			"./cknkcnk.png",
		];
		expect(fileNameUtils.getNewName(namesExtensions, baseFileName, extension)).toEqual(newName);
	});

	test(`формировать новое название файла на основе братьев и базового имени`, () => {
		const baseFileName = "cknkcnk";
		const extension = "png";
		const newName = "./cknkcnk-2.png";
		const namesExtensions = [
			"./.git",
			"./new-article-3",
			"./aaaa-2.png",
			"./aaaa-3.png",
			"./aaaa.mermaid",
			"./etyetytey-2.png",
			"./etyetytey.md",
			"./aaaa.svg",
			"./aaaa",
			"./cknkcnk.md",
			"./cknkcnk.svg",
			"./cknkcnk-3.svg",
			"./cknkcnk-2.svg",
			"./undefined.png",
			"./cknkcnk.png",
		];
		expect(fileNameUtils.getNewName(namesExtensions, baseFileName, extension)).toEqual(newName);
	});

	test(`формировать новое название файла если указан индекс`, () => {
		const baseFileName = "cknkcnk-2";
		const extension = "png";
		const newName = "./cknkcnk-3.png";
		const namesExtensions = [
			"./.git",
			"./new-article-3",
			"./aaaa-2.png",
			"./aaaa-3.png",
			"./aaaa.mermaid",
			"./etyetytey-2.png",
			"./etyetytey.md",
			"./aaaa.svg",
			"./aaaa",
			"./cknkcnk.md",
			"./cknkcnk.svg",
			"./cknkcnk-3.svg",
			"./cknkcnk-2.svg",
			"./undefined.png",
			"./cknkcnk.png",
			"./cknkcnk-2.png",
		];
		expect(fileNameUtils.getNewName(namesExtensions, baseFileName, extension)).toEqual(newName);
	});
});
