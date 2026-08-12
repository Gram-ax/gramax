import { GitTreeScopeParser } from "../GitTreeScopeParser";

const HASH_A = "a".repeat(40);
const HASH_B = "b".repeat(40);

describe("GitTreeScopeParser.parse", () => {
	test("returns null for empty string", () => {
		expect(GitTreeScopeParser.parse("")).toBeNull();
	});

	test('returns "HEAD" for string "HEAD"', () => {
		expect(GitTreeScopeParser.parse("HEAD")).toBe("HEAD");
	});

	describe("commit-", () => {
		test("parses commit scope", () => {
			expect(GitTreeScopeParser.parse(`commit-${HASH_A}`)).toEqual({ commit: HASH_A });
		});
	});

	describe("reference-", () => {
		test("parses reference scope", () => {
			expect(GitTreeScopeParser.parse("reference-main")).toEqual({ reference: "main" });
		});

		test("parses reference scope with slash in name", () => {
			expect(GitTreeScopeParser.parse("reference-feature/my-branch")).toEqual({
				reference: "feature/my-branch",
			});
		});
	});

	describe("dif-", () => {
		test("parses dif scope with two valid hashes", () => {
			expect(GitTreeScopeParser.parse(`dif-${HASH_A}-${HASH_B}`)).toEqual({
				oldCommit: { commit: HASH_A },
				newCommit: { commit: HASH_B },
			});
		});

		test("returns null for dif scope with short hashes", () => {
			expect(GitTreeScopeParser.parse("dif-abc123-def456")).toBeNull();
		});

		test("returns null for dif- with no hashes", () => {
			expect(GitTreeScopeParser.parse("dif-")).toBeNull();
		});

		test("returns null for dif- with only one hash", () => {
			expect(GitTreeScopeParser.parse(`dif-${HASH_A}`)).toBeNull();
		});
	});

	test("treats unrecognized string as reference scope", () => {
		expect(GitTreeScopeParser.parse("unknown-scope")).toEqual({ reference: "unknown-scope" });
	});
});

describe("GitTreeScopeParser.toString", () => {
	test("возвращает null для null", () => {
		expect(GitTreeScopeParser.toString(null)).toBeNull();
	});

	test('возвращает "HEAD" для scope "HEAD"', () => {
		expect(GitTreeScopeParser.toString("HEAD")).toBe("HEAD");
	});

	test("сериализует commit-scope", () => {
		expect(GitTreeScopeParser.toString({ commit: HASH_A })).toBe(`commit-${HASH_A}`);
	});

	test("сериализует reference-scope", () => {
		expect(GitTreeScopeParser.toString({ reference: "main" })).toBe("main");
	});

	test("сериализует dif-scope", () => {
		expect(GitTreeScopeParser.toString({ oldCommit: { commit: HASH_A }, newCommit: { commit: HASH_B } })).toBe(
			`dif-${HASH_A}-${HASH_B}`,
		);
	});
});

describe("GitTreeScopeParser: round-trip", () => {
	test("parse(toString(scope)) === scope для HEAD", () => {
		expect(GitTreeScopeParser.parse(GitTreeScopeParser.toString("HEAD"))).toBe("HEAD");
	});

	test("parse(toString(scope)) === scope для commit-scope", () => {
		const scope = { commit: HASH_A };
		expect(GitTreeScopeParser.parse(GitTreeScopeParser.toString(scope))).toEqual(scope);
	});

	test("parse(toString(scope)) === scope для dif-scope", () => {
		const scope = { oldCommit: { commit: HASH_A }, newCommit: { commit: HASH_B } };
		expect(GitTreeScopeParser.parse(GitTreeScopeParser.toString(scope))).toEqual(scope);
	});

	test("parse(toString(scope)) === scope для reference-scope", () => {
		const scope = { reference: "main" };
		expect(GitTreeScopeParser.parse(GitTreeScopeParser.toString(scope))).toEqual(scope);
	});
});
