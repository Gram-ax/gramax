import Path from "@core/FileProvider/Path/Path";
import SearchArticleContentParser from "@ext/serach/modulith/parsing/SearchArticleContentParser";
import { it } from "@jest/globals";
import testModel1 from "./testModel1.json";
import testModel1Expected from "./testModel1Expected.json";
import testModel2 from "./testModel2.json";
import testModel2Expected from "./testModel2Expected.json";
import testModel3 from "./testModel3.json";
import testModel3Expected from "./testModel3Expected.json";

const getSnippetItems = (id: string) => {
	throw new Error(`getSnippetItems attempt, id: ${id}`);
};

const getPropertyValue = (id: string) => {
	throw new Error(`getPropertyValue attempt, id: ${id}`);
};

const getLinkId = (path: Path) => {
	throw new Error(`getLinkId attempt, id: ${path.toString()}`);
};

describe("SearchArticleContentParser", () => {
	it("test testModel1", async () => {
		const actual = await new SearchArticleContentParser(
			testModel1.content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		).parse();
		expect(actual).toEqual(testModel1Expected);
	});

	it("test testModel2", async () => {
		const actual = await new SearchArticleContentParser(
			testModel2.content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		).parse();
		expect(actual).toEqual(testModel2Expected);
	});

	it("test testModel3", async () => {
		const actual = await new SearchArticleContentParser(
			testModel3.content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		).parse();
		expect(actual).toEqual(testModel3Expected);
	});
});
