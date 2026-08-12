import { getAliasRedirect } from "./aliasRedirect";

const aliased = { aliasedFrom: "docs/old", pathname: "docs/guide/install" };

describe("getAliasRedirect", () => {
	test("aliased article turns into a 302 to the canonical pathname", () => {
		expect(getAliasRedirect(aliased, { path: ["docs", "old"] })).toEqual({
			destination: "/docs/guide/install",
			statusCode: 302,
		});
	});

	test("route segments are dropped, the reader's search params carry over", () => {
		// Next merges the [[...path]] catch-all into query for both direct hits
		// and _next/data navigations — `path` must never leak into the redirect
		const query = { path: ["docs", "old"], from: "newsletter", tags: ["a", "b"] };
		expect(getAliasRedirect(aliased, query)?.destination).toBe("/docs/guide/install?from=newsletter&tags=a&tags=b");
	});

	test("docportal passes URLSearchParams: repeats survive, no `path` to drop", () => {
		const search = new URLSearchParams("from=newsletter&tags=a&tags=b");
		expect(getAliasRedirect(aliased, search)?.destination).toBe(
			"/docs/guide/install?from=newsletter&tags=a&tags=b",
		);
	});

	test("no redirect for a plain article, a missing pathname, or an error article", () => {
		expect(getAliasRedirect({ pathname: "docs/plain" }, {})).toBeNull();
		expect(getAliasRedirect({ aliasedFrom: "docs/old" }, {})).toBeNull();
		expect(getAliasRedirect({ ...aliased, errorCode: 403 }, {})).toBeNull();
	});
});
