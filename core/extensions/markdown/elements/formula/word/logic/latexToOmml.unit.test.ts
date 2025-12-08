import { latexToOmmlComponent } from "./latexToOmml";

jest.setTimeout(15000);

describe("latexToOmmlComponent", () => {
	it("converts inline latex to OMML component", async () => {
		const result = await latexToOmmlComponent("E=mc^2", false);

		expect(result).not.toBeNull();
		expect((result as any).component?.rootKey).toBe("m:oMath");
	});

	it("caches results for the same input", async () => {
		const first = await latexToOmmlComponent("x^2", false);
		const second = await latexToOmmlComponent("x^2", false);

		expect(first).toBe(second);
	});
});
