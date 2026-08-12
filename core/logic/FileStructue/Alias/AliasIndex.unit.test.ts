import { AliasIndex, type AliasSource, normalizeAliasPath } from "./AliasIndex";

const article = (logicPath: string, aliases?: AliasSource["aliases"]): AliasSource => ({
	logicPath,
	isCategory: false,
	aliases,
});
const category = (logicPath: string, aliases?: AliasSource["aliases"]): AliasSource => ({
	logicPath,
	isCategory: true,
	aliases,
});

describe("AliasIndex", () => {
	describe("resolve", () => {
		test("exact article alias", () => {
			const index = AliasIndex.build([article("docs/guide/install", ["docs/install"])]);
			expect(index.resolve("docs/install")).toBe("docs/guide/install");
		});

		test("category alias: exact hit for the category page itself", () => {
			const index = AliasIndex.build([category("docs/api", ["docs/rest"])]);
			expect(index.resolve("docs/rest")).toBe("docs/api");
		});

		test("category alias: prefix rewrite keeps the tail", () => {
			const index = AliasIndex.build([
				category("docs/api/legacy", ["docs/api/v1"]),
				article("docs/api/legacy/auth"),
			]);
			expect(index.resolve("docs/api/v1/auth")).toBe("docs/api/legacy/auth");
		});

		test("prefix rewrite feeds back into an exact alias (layered history)", () => {
			// docs/old-guide/install -> (category prefix) docs/guide/install -> (exact alias) docs/setup/install
			const index = AliasIndex.build([
				category("docs/guide", ["docs/old-guide"]),
				article("docs/setup/install", ["docs/guide/install"]),
			]);
			expect(index.resolve("docs/old-guide/install")).toBe("docs/setup/install");
		});

		test("chronological fallback restores the intermediate name (orphan epoch)", () => {
			// section renamed guide -> manual (T1) -> handbook (T3); install left it at T2, so its
			// alias lives in the "manual" epoch that exists neither as a path nor as the request.
			// docs/guide/install resolves only by walking the section's former names oldest-first.
			const index = AliasIndex.build([
				category("docs/handbook", [
					{ path: "docs/guide", moved: "2026-03-10T11:00:00Z" },
					{ path: "docs/manual", moved: "2026-07-01T16:40:00Z" },
				]),
				article("docs/setup/install", [{ path: "docs/manual/install", moved: "2026-05-20T08:30:00Z" }]),
			]);
			expect(index.resolve("docs/guide/install")).toBe("docs/setup/install");
		});

		test("prefix target without a live article is a miss, not a dead redirect", () => {
			const index = AliasIndex.build([category("docs/api/legacy", ["docs/api/v1"])]);
			expect(index.resolve("docs/api/v1/ghost")).toBeNull();
		});

		test("longest prefix wins, shorter serves the rest", () => {
			const index = AliasIndex.build([
				category("docs/api", ["docs/rest"]),
				category("docs/api/v2", ["docs/rest/v1"]),
				article("docs/api/v2/auth"),
				article("docs/api/other"),
			]);
			expect(index.resolve("docs/rest/v1/auth")).toBe("docs/api/v2/auth");
			expect(index.resolve("docs/rest/other")).toBe("docs/api/other");
		});

		test("exact article alias beats a covering category prefix", () => {
			const index = AliasIndex.build([
				article("docs/elsewhere/install", ["docs/guide/install"]),
				article("docs/manual/install"),
				category("docs/manual", ["docs/guide"]),
			]);
			expect(index.resolve("docs/guide/install")).toBe("docs/elsewhere/install");
		});

		test("hostile mutual prefixes terminate without a hit", () => {
			// unreachable through legal states (shadow rule), but the resolver
			// must survive a corrupt index input
			const index = AliasIndex.build([category("docs/a", ["docs/b"]), category("docs/b", ["docs/a"])]);
			expect(index.resolve("docs/a/ghost")).toBeNull();
		});

		test("deep dead tail hits the candidate cap", () => {
			// docs/a aliased as docs/a/sub rewrites the tail into itself one level at a
			// time; MAX_CANDIDATES must cut the walk instead of chewing the whole path
			const index = AliasIndex.build([category("docs/a", ["docs/a/sub"])]);
			expect(index.resolve(`docs/a/${"sub/".repeat(12)}page`)).toBeNull();
		});
	});

	describe("build policy", () => {
		test("self-alias and shadowed-by-real are dropped", () => {
			const index = AliasIndex.build([article("docs/a", ["docs/a", "docs/b"]), article("docs/b")]);
			expect(index.resolve("docs/a")).toBeNull();
			expect(index.resolve("docs/b")).toBeNull();
		});

		test("duplicate manual aliases: lexicographically smaller owner wins, scan-order independent", () => {
			const forward = AliasIndex.build([article("docs/alpha", ["docs/dup"]), article("docs/zeta", ["docs/dup"])]);
			const reversed = AliasIndex.build([
				article("docs/zeta", ["docs/dup"]),
				article("docs/alpha", ["docs/dup"]),
			]);
			expect(forward.resolve("docs/dup")).toBe("docs/alpha");
			expect(reversed.resolve("docs/dup")).toBe("docs/alpha");
		});

		test("duplicate auto aliases: newer moved wins", () => {
			const index = AliasIndex.build([
				article("docs/alpha", [{ path: "docs/dup", moved: "2026-01-01T00:00:00Z" }]),
				article("docs/zeta", [{ path: "docs/dup", moved: "2026-06-01T00:00:00Z" }]),
			]);
			expect(index.resolve("docs/dup")).toBe("docs/zeta");
		});

		test("manual beats auto; undated auto loses to dated", () => {
			const manualVsAuto = AliasIndex.build([
				article("docs/zeta-manual", ["docs/dup"]),
				article("docs/alpha-auto", [{ path: "docs/dup", moved: "2026-06-01T00:00:00Z" }]),
			]);
			expect(manualVsAuto.resolve("docs/dup")).toBe("docs/zeta-manual");

			const brokenVsDated = AliasIndex.build([
				article("docs/alpha", [{ path: "docs/dup", moved: "garbage" }]),
				article("docs/zeta", [{ path: "docs/dup", moved: "2026-06-01T00:00:00Z" }]),
			]);
			expect(brokenVsDated.resolve("docs/dup")).toBe("docs/zeta");
		});

		test("dirty entries: junk skipped, duplicates within one item kept once, broken moved stays usable", () => {
			const index = AliasIndex.build([
				article("docs/clean", [
					"docs/dup",
					"docs/dup",
					42 as unknown as string,
					{} as { path: string },
					{ path: "docs/broken-date", moved: "yesterday" },
				]),
			]);
			expect(index.resolve("docs/dup")).toBe("docs/clean");
			expect(index.resolve("docs/broken-date")).toBe("docs/clean");
		});

		test("object entry without moved resolves and is not reported as broken-moved", () => {
			// { path } with no moved is legal per the type: rank it as an undated auto
			// entry, but a missing timestamp is not a malformed one
			const index = AliasIndex.build([article("docs/clean", [{ path: "docs/plain-object" }])]);
			expect(index.resolve("docs/plain-object")).toBe("docs/clean");
			expect(index.diagnostics).toEqual([]);
		});

		test("malformed moved timestamp is reported but the alias keeps working", () => {
			const index = AliasIndex.build([article("docs/clean", [{ path: "docs/broken", moved: "yesterday" }])]);
			expect(index.resolve("docs/broken")).toBe("docs/clean");
			expect(index.diagnostics).toEqual([
				{ kind: "broken-moved", owner: "docs/clean", path: "docs/broken", moved: "yesterday" },
			]);
		});

		test("empty catalog resolves nothing", () => {
			const index = AliasIndex.build([]);
			expect(index.isEmpty).toBe(true);
			expect(index.resolve("docs/anything")).toBeNull();
		});
	});

	describe("normalizeAliasPath", () => {
		test.each([
			["/lead", "lead"],
			["trail/", "trail"],
			["old.md", "old"],
			["  spaced  ", "spaced"],
			["/all/three.md", "all/three"],
		])("%s -> %s", (raw, expected) => {
			expect(normalizeAliasPath(raw)).toBe(expected);
		});
	});
});
