import tokenizer from "./tokenizer";

const tok = (str) => ({ str, metadata: {} });

describe("Lunr tokenizer правильно токенизирует", () => {
	test("строку без специальных символов", () => {
		const input = "Простой текст без специальных символов";
		const expected = [tok("простой"), tok("текст"), tok("без"), tok("специальных"), tok("символов")];
		expect(tokenizer(input)).toEqual(expected);
	});

	test("строку со специальными символами", () => {
		const input = "Текст Текст $$$ с $пеци@льными с!имволами";
		const expected = [
			tok("текст"),
			tok("текст"),
			tok("$$$"),
			tok("с"),
			tok("$пеци@льными"),
			tok("с"),
			tok("имволами"),
		];
		expect(tokenizer(input)).toEqual(expected);
	});

	test("строку с знаками препинани", () => {
		const input = "Текст-Текст2 Текст, $$$. с $пеци@льными: с!имвол?ами; $.{свойство}.";
		const expected = [
			tok("текст"),
			tok("текст2"),
			tok("текст"),
			tok("$$$"),
			tok("с"),
			tok("$пеци@льными"),
			tok("с"),
			tok("имвол"),
			tok("ами"),
			tok("$"),
			tok("{свойство}"),
		];
		expect(tokenizer(input)).toEqual(expected);
	});

	test("пустую строку", () => {
		const input = "";
		const expected = [];
		expect(tokenizer(input)).toEqual(expected);
	});

	test("undefined", () => {
		const input = undefined;
		const expected = [];
		expect(tokenizer(input)).toEqual(expected);
	});
});
