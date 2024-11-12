import prepareFuseString, { normalizeQuotationMarks } from "./prepareFuseString";

describe("prepareFuseString обрабатывает строку, в которой есть", () => {
	test("|", () => {
		const result1 = prepareFuseString("|");
		const result2 = prepareFuseString("было |слово");
		const result3 = prepareFuseString("| слово");
		const result4 = prepareFuseString("сло|во");
		const result5 = prepareFuseString("|слово");
		const result6 = prepareFuseString("слово|");
		const result7 = prepareFuseString("было | слово");

		expect(result1).toEqual("| ");
		expect(result2).toEqual("было |слово ");
		expect(result3).toEqual("| слово ");
		expect(result4).toEqual("сло|во ");
		expect(result5).toEqual("|слово ");
		expect(result6).toEqual("слово| ");
		expect(result7).toEqual("было слово ");
	});

	test("'", () => {
		const result1 = prepareFuseString("'");
		const result2 = prepareFuseString("было 'слово");
		const result3 = prepareFuseString("' слово");
		const result4 = prepareFuseString("сло'во");
		const result5 = prepareFuseString("'слово");
		const result6 = prepareFuseString("слово'");

		expect(result1).toEqual("' ");
		expect(result2).toEqual("было слово ");
		expect(result3).toEqual("' слово ");
		expect(result4).toEqual("сло'во ");
		expect(result5).toEqual("слово ");
		expect(result6).toEqual("слово' ");
	});

	test("!", () => {
		const result1 = prepareFuseString("!");
		const result2 = prepareFuseString("было !слово");
		const result3 = prepareFuseString("! слово");
		const result4 = prepareFuseString("сло!во");
		const result5 = prepareFuseString("!слово");
		const result6 = prepareFuseString("слово!");

		expect(result1).toEqual("! ");
		expect(result2).toEqual("было слово ");
		expect(result3).toEqual("! слово ");
		expect(result4).toEqual("сло!во ");
		expect(result5).toEqual("слово ");
		expect(result6).toEqual("слово! ");
	});

	test('"фраза"', () => {
		const result1 = prepareFuseString('""');
		const result2 = prepareFuseString('было "слово"');
		const result3 = prepareFuseString('" слово');
		const result4 = prepareFuseString('сло"во"');
		const result5 = prepareFuseString('"слово"');
		const result6 = prepareFuseString('слово"');

		expect(result1).toEqual('"" ');
		expect(result2).toEqual('было  \'"слово" ');
		expect(result3).toEqual('" слово ');
		expect(result4).toEqual('сло \'"во" ');
		expect(result5).toEqual(' \'"слово" ');
		expect(result6).toEqual('слово" ');
	});

	test("-", () => {
		const result1 = prepareFuseString("-");
		const result2 = prepareFuseString("было -слово");
		const result3 = prepareFuseString("- слово");
		const result4 = prepareFuseString("сло-во");
		const result5 = prepareFuseString("-слово");
		const result6 = prepareFuseString("слово-");

		expect(result1).toEqual("- ");
		expect(result2).toEqual(" !слово было ");
		expect(result3).toEqual("- слово ");
		expect(result4).toEqual("сло-во ");
		expect(result5).toEqual("!слово ");
		expect(result6).toEqual("слово- ");
	});

	test("“", () => {
		const result1 = normalizeQuotationMarks('-“"');
		const result2 = normalizeQuotationMarks('"было“ слово');
		const result3 = normalizeQuotationMarks("слово");
		const result4 = normalizeQuotationMarks("““““““““");

		expect(result1).toEqual('-""');
		expect(result2).toEqual('"было" слово');
		expect(result3).toEqual("слово");
		expect(result4).toEqual('""""""""');
	});
});
