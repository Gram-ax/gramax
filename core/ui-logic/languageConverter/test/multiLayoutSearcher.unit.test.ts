import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";

describe("multiLayoutSearcher ищет", () => {
	const searcher = function (query: string) {
		switch (query) {
			case "qwer":
				return "1";
			case "tyгш":
				return "2";
			case "щзх":
				return "3";
			case "asdf":
				return "4";
		}

		return null;
	};

	test("по запросу", () => {
		const text = "qwer";
		const result = multiLayoutSearcher<string>(searcher, true)(text);

		expect(result).toEqual("1");
	});

	test("по запросу на неправильной раскладке", () => {
		const text = "енui";
		const result = multiLayoutSearcher<string>(searcher, true)(text);

		expect(result).toEqual("2");
	});

	test("по запросу на неправильной раскладке + CAPS", () => {
		const text = "ЕНUI";
		const result = multiLayoutSearcher<string>(searcher, true)(text);

		expect(result).toEqual("2");
	});

	test("по запросу с транслетирацией с английского на русский", () => {
		const text = "schzkh";
		const result = multiLayoutSearcher<string>(searcher, true)(text);

		expect(result).toEqual("3");
	});

	test("по запросу с транслетирацией с русского на английский", () => {
		const text = "асдф";
		const result = multiLayoutSearcher<string>(searcher, true)(text);

		expect(result).toEqual("4");
	});

	test("и ничего не находит, если искомое не найдено", () => {
		const text = "асдфф";
		const result = multiLayoutSearcher<string>(searcher, true)(text);

		expect(result).toEqual(null);
	});
});
