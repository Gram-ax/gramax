import { confFixBadHTML } from "@ext/confluence/core/server/logic/ConfluenceServerConverter";

describe("confFixBadHTML", () => {
	describe("Замена нерабочих тэгов в HTML Confluence страницы", () => {
		test("ac:emoticon на emoji", () => {
			const badHTML = `<p>До эмодзи <ac:emoticon ac:name="grinning face with big eyes" ac:emoji-id="1f603" /> середина <ac:emoticon ac:name="smiling face with halo" ac:emoji-id="1f607" /> после </p>`;
			const goodHTML = `<p>До эмодзи <emoji id="1f603"></emoji> середина <emoji id="1f607"></emoji> после </p>`;

			const result = confFixBadHTML(badHTML);

			expect(result).toEqual(goodHTML);
		});
	});
});
