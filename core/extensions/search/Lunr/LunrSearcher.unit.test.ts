import lunr from "lunr";
import customPipeline from "./tokenizer/customPipeline";
import tokenizer from "./tokenizer/tokenizer";

lunr.Pipeline.registerFunction(customPipeline, "customPipeline");

describe("Lunr находит ", () => {
	const idx = lunr(function () {
		this.ref("id");
		this.field("title");
		this.field("content");

		this.tokenizer(tokenizer);
		this.pipeline.add(customPipeline);
		this.searchPipeline.add(customPipeline);

		this.pipeline.remove(lunr.trimmer);
		this.pipeline.remove(lunr.stopWordFilter);
		this.pipeline.remove(lunr.stemmer);

		this.searchPipeline.remove(lunr.trimmer);
		this.searchPipeline.remove(lunr.stopWordFilter);
		this.searchPipeline.remove(lunr.stemmer);

		this.metadataWhitelist = ["position"];

		this.add({
			title: "Пример документа",
			content: "Это содержимое $$$ @example.com документа с $ специальными символами: ",
			id: 1,
		});
		this.add({
			title: "Другой документ",
			content: "Содержимое другого <документа Без специальных < символов",
			id: 2,
		});
	});

	test("'@*'", () => {
		const results = idx.search("@*");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "1" });
	});

	test("'символами'", () => {
		const results = idx.search("символами");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "1" });
	});

	test("'@example'", () => {
		const results = idx.search("@example");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "1" });
	});

	// test("'com'", () => {
	// 	const results = idx.search("com");

	// 	expect(results).toHaveLength(1);
	// 	expect(results[0]).toMatchObject({ ref: "1" });
	// });

	test("'символами'", () => {
		const results = idx.search("символами");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "1" });
	});

	test("'документа'", () => {
		const results = idx.search("документа");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "1" });
	});

	test("'$'", () => {
		const results = idx.search("$");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "1" });
	});

	test("'$$$'", () => {
		const results = idx.search("$$$");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "1" });
	});

	test("'Без'", () => {
		const results = idx.search("Без");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "2" });
	});

	test("'<*'", () => {
		const results = idx.search("<*");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "2" });
	});

	test("'Содержимое'", () => {
		const results = idx.search("Содержимое");

		expect(results).toHaveLength(2);
		expect(results[0]).toMatchObject({ ref: "2" });
	});

	test("'<'", () => {
		const results = idx.search("<");

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ ref: "2" });
	});
});
