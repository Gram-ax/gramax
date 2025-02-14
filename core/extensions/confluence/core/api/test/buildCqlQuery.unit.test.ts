import buildCqlQuery from "../buildCqlQuery";

describe("buildCqlQuery", () => {
	test("должен создавать пустой запрос без параметров", () => {
		const result = buildCqlQuery({});
		expect(result).toBe(encodeURIComponent(""));
	});

	test("должен создавать запрос только с type", () => {
		const result = buildCqlQuery({ type: "page" });
		expect(result).toBe(encodeURIComponent('type="page"'));
	});

	test("должен создавать запрос с заданным title", () => {
		const result = buildCqlQuery({ title: "Test Page" });
		expect(result).toBe(encodeURIComponent('title~"Test Page*"'));
	});

	test("должен создавать запрос с заданным spaceKey", () => {
		const result = buildCqlQuery({ spaceKey: "TEST" });
		expect(result).toBe(encodeURIComponent('space="TEST"'));
	});

	test("должен создавать запрос со всеми параметрами", () => {
		const result = buildCqlQuery({
			type: "page",
			title: "Test",
			spaceKey: "TEST",
			orderBy: "created",
			sortDirection: "asc",
		});
		expect(result).toBe(encodeURIComponent('type="page" AND title~"Test*" AND space="TEST" ORDER BY created asc'));
	});

	test("должен создавать запрос с orderBy без указания sortDirection", () => {
		const result = buildCqlQuery({
			type: "page",
			orderBy: "created",
		});
		expect(result).toBe(encodeURIComponent('type="page" ORDER BY created desc'));
	});

	test("должен корректно обрабатывать пустые опциональные параметры", () => {
		const result = buildCqlQuery({
			type: "",
			title: "",
			spaceKey: "",
		});
		expect(result).toBe(encodeURIComponent(""));
	});
});
