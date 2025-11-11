import {
	getTitlePageContent,
	TITLE_HEADER_CLASS,
	TITLE_TOP_ELEMENT_CLASS,
	TITLE_TOP_ELEMENT_LEFT_CLASS,
	TITLE_TOP_ELEMENT_RIGHT_CLASS,
} from "../titlePage";

describe("titlePage helpers", () => {
	it("creates header and top sections with expected classes", () => {
		const { titleElement, topElement } = getTitlePageContent("Sample Title");

		expect(titleElement.tagName).toBe("H1");
		expect(titleElement.className).toBe(TITLE_HEADER_CLASS);
		expect(titleElement.textContent).toBe("Sample Title");

		expect(topElement.className).toBe(TITLE_TOP_ELEMENT_CLASS);
		expect(topElement.children).toHaveLength(2);
		expect(topElement.children[0].className).toBe(TITLE_TOP_ELEMENT_LEFT_CLASS);
		expect(topElement.children[1].className).toBe(TITLE_TOP_ELEMENT_RIGHT_CLASS);
	});
});
