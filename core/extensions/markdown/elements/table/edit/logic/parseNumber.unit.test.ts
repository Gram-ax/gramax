import parseNumber from "@ext/markdown/elements/table/edit/logic/parseNumber";

describe("parseNumber", () => {
	test("1000000,45", () => {
		const expected = 1000000.45;
		const result = parseNumber("1000000,45");
		expect(result).toBe(expected);
	});

	test("1000000.45", () => {
		const expected = 1000000.45;
		const result = parseNumber("1000000.45");
		expect(result).toBe(expected);
	});

	test("1 000 000,45", () => {
		const expected = 1000000.45;
		const result = parseNumber("1 000 000,45");
		expect(result).toBe(expected);
	});

	test("1 000 000.45", () => {
		const expected = 1000000.45;
		const result = parseNumber("1 000 000.45");
		expect(result).toBe(expected);
	});

	test("-1 000 000,45", () => {
		const expected = -1000000.45;
		const result = parseNumber("-1 000 000,45");
		expect(result).toBe(expected);
	});

	test("1 000 000,45-", () => {
		const expected = 1000000.45;
		const result = parseNumber("1 000 000,45-");
		expect(result).toBe(expected);
	});

	test("1,000,000.45", () => {
		const expected = 1000000.45;
		const result = parseNumber("1,000,000.45");
		expect(result).toBe(expected);
	});

	test("-1,000,000.45", () => {
		const expected = -1000000.45;
		const result = parseNumber("-1,000,000.45");
		expect(result).toBe(expected);
	});

	test("1.000.000,45", () => {
		const expected = 1000000.45;
		const result = parseNumber("1.000.000,45");
		expect(result).toBe(expected);
	});

	test("-1.000.000,45", () => {
		const expected = -1000000.45;
		const result = parseNumber("-1.000.000,45");
		expect(result).toBe(expected);
	});

	test("не парсит строку с нечисловым символом", () => {
		const expected = undefined;
		const result = parseNumber("1. тесто");
		expect(result).toBe(expected);
	});
});
