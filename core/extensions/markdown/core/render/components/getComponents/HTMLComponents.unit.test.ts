import Path from "@core/FileProvider/Path/Path";
import type ParserContext from "../../../Parser/ParserContext/ParserContext";
import HTMLComponents from "./HTMLComponents";

describe("HTMLComponents", () => {
	test("uses a relative resource URL when request origin is unavailable", () => {
		const context = {
			getCatalog: () => ({ name: "help" }),
			getArticle: () => ({ logicPath: "help/trki" }),
			getBasePath: () => Path.empty,
		} as ParserContext;

		const resourceUrl = new HTMLComponents(undefined, context).getApiArticleResource("/_index.png");

		expect(resourceUrl).toBe("/api/catalogs/help/articles/trki/resources/%2F_index.png");
	});
});
