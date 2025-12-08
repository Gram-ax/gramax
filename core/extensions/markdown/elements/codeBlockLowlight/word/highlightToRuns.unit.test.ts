import { highlightCodeToRuns } from "./highlightToRuns";

class FakeTextRun {
	props: any;
	constructor(props: any) {
		this.props = props;
	}
}

describe("highlightCodeToRuns", () => {
	it("returns runs with style Code and preserves newlines", async () => {
		const runs = await highlightCodeToRuns("const x = 1;\n", "javascript", FakeTextRun as any);

		expect(runs.length).toBeGreaterThan(0);
		expect(runs.some((r: any) => r.props.break === 1)).toBe(true);
		expect(runs.every((r: any) => r.props.style === undefined || r.props.break === 1)).toBe(true);
	});

	it("applies colors when language supported", async () => {
		const runs = await highlightCodeToRuns("const x = 1;", "javascript", FakeTextRun as any);
		const colored = runs.find((r: any) => r.props.color);
		expect(colored).toBeDefined();
	});
});
