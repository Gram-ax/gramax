import computeLfsDivergence from "@core/GitLfs/logic/computeLfsDivergence";

describe("computeLfsDivergence", () => {
	test("empty workspace patterns never diverge", () => {
		expect(computeLfsDivergence([], ["*.psd"])).toEqual({ added: [], removed: [] });
		expect(computeLfsDivergence(undefined, ["*.psd"])).toEqual({ added: [], removed: [] });
	});

	test("no divergence when sets equal regardless of order", () => {
		expect(computeLfsDivergence(["*.psd", "*.csv"], ["*.csv", "*.psd"])).toEqual({ added: [], removed: [] });
	});

	test("detects added patterns", () => {
		expect(computeLfsDivergence(["*.psd", "*.csv"], ["*.psd"])).toEqual({ added: ["*.csv"], removed: [] });
	});

	test("detects removed patterns", () => {
		expect(computeLfsDivergence(["*.psd"], ["*.psd", "*.csv"])).toEqual({ added: [], removed: ["*.csv"] });
	});

	test("detects both", () => {
		expect(computeLfsDivergence(["*.png"], ["*.psd"])).toEqual({ added: ["*.png"], removed: ["*.psd"] });
	});

	test("duplicates in inputs do not produce phantom divergence", () => {
		expect(computeLfsDivergence(["*.psd", "*.psd"], ["*.psd"])).toEqual({ added: [], removed: [] });
	});
});
