import { ContentLanguage } from "@ext/localization/core/model/Language";
import { getLang } from "@ext/serach/modulith/utils/getLang";

describe("getLang", () => {
	const ru = ContentLanguage.ru;

	describe("single-language catalog (supportedLanguages: [ru])", () => {
		const supported = [ContentLanguage.ru];

		test("a normal article path resolves to the catalog language", () => {
			expect(getLang("catalog/guides/intro", ru, supported)).toBe(ru);
		});

		test("a top-level slug that looks like a language code is not a language section (#192)", () => {
			// e.g. an article transferred to the catalog root whose slug happens to be "it"
			expect(getLang("catalog/it", ru, supported)).toBe(ru);
		});

		test("an unsupported language-like segment does not override the catalog language (#192)", () => {
			expect(getLang("catalog/en/foo", ru, supported)).toBe(ru);
		});
	});

	describe("multi-language catalog (supportedLanguages: [ru, en])", () => {
		const supported = [ContentLanguage.ru, ContentLanguage.en];

		test("a genuine supported language section is detected", () => {
			expect(getLang("catalog/en/foo", ru, supported)).toBe(ContentLanguage.en);
		});

		test("the primary language section resolves to the catalog language", () => {
			expect(getLang("catalog/guides/intro", ru, supported)).toBe(ru);
		});
	});

	test("falls back to 'none' when there is no catalog language and nothing is supported", () => {
		expect(getLang("catalog/it", undefined, [])).toBe("none");
	});
});
