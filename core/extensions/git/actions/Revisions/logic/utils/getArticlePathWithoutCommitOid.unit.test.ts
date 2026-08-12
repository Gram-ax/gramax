import { getArticlePathWithoutCommitOid } from "./getArticlePathWithoutCommitOid";

const OLD = "a".repeat(40);
const NEW = "b".repeat(40);

describe("getArticlePathWithoutCommitOid", () => {
	it("removes commit oid from middle of path", () => {
		expect(getArticlePathWithoutCommitOid("catalog:commit-abc123/article/path.md")).toBe("catalog/article/path.md");
	});

	it("removes commit oid at end of string", () => {
		expect(getArticlePathWithoutCommitOid("catalog:commit-abc123")).toBe("catalog");
	});

	it("supports tilde separator", () => {
		expect(getArticlePathWithoutCommitOid("catalog~commit-abc123/article/path.md")).toBe("catalog/article/path.md");
	});

	it("supports tilde separator at end", () => {
		expect(getArticlePathWithoutCommitOid("catalog~commit-abc123")).toBe("catalog");
	});

	it("returns pathname unchanged when no commit oid present", () => {
		expect(getArticlePathWithoutCommitOid("catalog/article/path.md")).toBe("catalog/article/path.md");
	});

	it("handles nested article path after commit oid", () => {
		expect(getArticlePathWithoutCommitOid("my-catalog:commit-deadbeef/nested/deep/article.md")).toBe(
			"my-catalog/nested/deep/article.md",
		);
	});

	it("removes dif- scope from middle of path", () => {
		expect(getArticlePathWithoutCommitOid(`catalog:dif-${OLD}-${NEW}/article/path.md`)).toBe(
			"catalog/article/path.md",
		);
	});

	it("removes dif- scope at end of string", () => {
		expect(getArticlePathWithoutCommitOid(`catalog:dif-${OLD}-${NEW}`)).toBe("catalog");
	});

	it("removes dif- scope with tilde separator", () => {
		expect(getArticlePathWithoutCommitOid(`catalog~dif-${OLD}-${NEW}/article/path.md`)).toBe(
			"catalog/article/path.md",
		);
	});
});
