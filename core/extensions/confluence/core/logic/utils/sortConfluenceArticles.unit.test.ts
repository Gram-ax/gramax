import { sortConfluenceArticles } from "./sortConfluenceArticles";
import { ConfluenceArticleTree } from "@ext/confluence/core/model/ConfluenceArticle";

const RU_ALPHA = "\u0410\u043b\u044c\u0444\u0430";
const RU_APPLE = "\u042f\u0431\u043b\u043e\u043a\u043e";
const RU_ANCHOR = "\u042f\u043a\u043e\u0440\u044c";

const createNode = (
	overrides: Partial<ConfluenceArticleTree> & Pick<ConfluenceArticleTree, "id" | "title" | "position">,
): ConfluenceArticleTree => ({
	domain: "test",
	id: overrides.id,
	linkUi: "",
	title: overrides.title,
	position: overrides.position,
	parentId: overrides.parentId,
	parentType: overrides.parentType ?? "page",
	content: "",
	children: [],
	...overrides,
});

describe("sortConfluenceArticles", () => {
	it("sorts by numeric position when not all positions are -1", () => {
		const nodes = [
			createNode({ id: "c", title: "C", position: 2 }),
			createNode({ id: "a", title: "A", position: 0 }),
			createNode({ id: "b", title: "B", position: 1 }),
		];

		sortConfluenceArticles(nodes);

		expect(nodes.map((node) => node.id)).toEqual(["a", "b", "c"]);
	});

	it("sorts alphabetically when every position is -1", () => {
		const nodes = [
			createNode({ id: "ru2", title: RU_APPLE, position: -1 }),
			createNode({ id: "en2", title: "beta", position: -1 }),
			createNode({ id: "other", title: "123", position: -1 }),
			createNode({ id: "en1", title: "Alpha", position: -1 }),
			createNode({ id: "ru1", title: RU_ALPHA, position: -1 }),
		];

		sortConfluenceArticles(nodes);

		expect(nodes.map((node) => node.id)).toEqual(["en1", "en2", "ru1", "ru2", "other"]);
	});

	it("trims leading whitespace before grouping by alphabet", () => {
		const nodes = [
			createNode({ id: "ru", title: `  ${RU_ANCHOR}`, position: -1 }),
			createNode({ id: "en", title: "   Apple", position: -1 }),
		];

		sortConfluenceArticles(nodes);

		expect(nodes.map((node) => node.id)).toEqual(["en", "ru"]);
	});
});
