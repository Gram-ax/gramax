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

	test("по запросу", async () => {
		const text = "qwer";
		const result = await multiLayoutSearcher<string>(searcher)(text);

		expect(result).toEqual("1");
	});

	test("по запросу на неправильной раскладке", async () => {
		const text = "енui";
		const result = await multiLayoutSearcher<string>(searcher)(text);

		expect(result).toEqual("2");
	});

	test("по запросу с транслетирацией с английского на русский", async () => {
		const text = "schzkh";
		const result = await multiLayoutSearcher<string>(searcher)(text);

		expect(result).toEqual("3");
	});

	test("по запросу с транслетирацией с русского на английский", async () => {
		const text = "асдф";
		const result = await multiLayoutSearcher<string>(searcher)(text);

		expect(result).toEqual("4");
	});

	test("и ничего не находит, если искомое не найдено", async () => {
		const text = "асдфф";
		const result = await multiLayoutSearcher<string>(searcher)(text);

		expect(result).toEqual(null);
	});
});
