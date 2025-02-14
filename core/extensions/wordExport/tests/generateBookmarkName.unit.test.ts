import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";

describe("generateBookmarkName правильно", () => {
	test("генерирует закладку с id", () => {
		const order = "1.";
		const title = "Test Title";
		const id = "test-id";

		const result = generateBookmarkName(order, title, id);

		expect(result).toEqual("1.Test_Title_test-id");
	});

	test("генерирует закладку без id", () => {
		const order = "2.";
		const title = "Another Title";

		const result = generateBookmarkName(order, title);

		expect(result).toEqual("2.Another_Title");
	});

	test("заменяет пробелы на подчеркивания в названии", () => {
		const order = "3.";
		const title = "Complex Title With Spaces";
		const id = "test-id";

		const result = generateBookmarkName(order, title, id);

		expect(result).toEqual("3.Complex_Title_With_Spaces_test-id");
	});

	test("работает с пустым order", () => {
		const order = "";
		const title = "Title";
		const id = "test-id";

		const result = generateBookmarkName(order, title, id);

		expect(result).toEqual("Title_test-id");
	});

	test("работает с пустым title", () => {
		const order = "1.";
		const title = "";
		const id = "test-id";

		const result = generateBookmarkName(order, title, id);

		expect(result).toEqual("1._test-id");
	});

	test("работает с пустым order и title", () => {
		const order = "";
		const title = "";
		const id = "test-id";

		const result = generateBookmarkName(order, title, id);

		expect(result).toEqual("_test-id");
	});
});
