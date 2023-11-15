import { getParserTestData } from "../test/getParserTestData";

describe("Context", () => {
	describe("Правильно ищет аттрибут по его названию", () => {
		test("Object", async () => {
			const { parseContext } = await getParserTestData("articleTest");
			const terms = parseContext.getProp("variables");
			const example = {
				currentArticleVariable: "current article value",
				categoryVariable: "category value",
				docRootVariable: "doc root value",
				nested: {
					variable: {
						name: "some name",
					},
				},
				overlap: "latest overlap",
			};

			expect(terms).toEqual(example);
		});

		test("String", async () => {
			const { parseContext } = await getParserTestData("articleTest");
			const terms = parseContext.getProp("stringProp");
			const example = "some string";

			expect(terms).toEqual(example);
		});

		test("Number", async () => {
			const { parseContext } = await getParserTestData("articleTest");
			const terms = parseContext.getProp("numberProp");
			const example = 123456;

			expect(terms).toEqual(example);
		});
	});
});
