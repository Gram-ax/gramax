import { buildInlineMathRun } from "./buildInlineMathRun";

class FakeXmlComponent {
	rootKey: string;
	root: any[];
	constructor(name: string) {
		this.rootKey = name;
		this.root = [];
	}
	static fromXmlString(xml: string) {
		const match = /w:val="([^"]+)"/.exec(xml);
		return {
			rootKey: "w:rStyle",
			root: [{ rootKey: "_attr", root: { "w:val": match ? match[1] : undefined } }],
		};
	}
}

describe("buildInlineMathRun", () => {
	it("wraps math component with styled run", () => {
		const mathComponent = { rootKey: "m:oMath", root: [] };
		const run = buildInlineMathRun(mathComponent, "FormulaInline", FakeXmlComponent as any);

		expect(run?.rootKey).toBe("w:r");
		const rPr = run?.root?.find((c: any) => c.rootKey === "w:rPr");
		expect(rPr).toBeDefined();

		const style = rPr?.root?.find((c: any) => c.rootKey === "w:rStyle");
		expect(style?.root?.[0]?.root?.["w:val"]).toBe("FormulaInline");

		expect(run?.root?.includes(mathComponent)).toBe(true);
	});
});
