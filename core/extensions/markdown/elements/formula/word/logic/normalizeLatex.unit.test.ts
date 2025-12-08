import { normalizeLatex } from "./normalizeLatex";

describe("normalizeLatex", () => {
	it("trims inline math markers", () => {
		expect(normalizeLatex("$E=mc^2$")).toEqual({ latex: "E=mc^2", display: false });
	});

	it("trims display math markers", () => {
		expect(normalizeLatex("$$ \\int_a^b $$")).toEqual({ latex: "\\int_a^b", display: true });
	});

	it("returns plain text unchanged", () => {
		expect(normalizeLatex(" text ")).toEqual({ latex: "text", display: false });
	});
});
