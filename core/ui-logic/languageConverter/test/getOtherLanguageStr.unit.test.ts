import { converterToEng, getOtherLanguageStr } from "@core-ui/languageConverter/getOtherLanguageStr";
import { converterToRus } from "@core-ui/languageConverter/getRussianStr";

describe("getOtherLanguageStr транслитерирует", () => {
	test("с русского на английский", () => {
		const text = "щрефоывашфывефдауезуехфывь";
		const result = getOtherLanguageStr(text, converterToEng);

		expect(result).toEqual("schrefoyvashfyvefdauezuekhfyv");
	});

	test("с английского на русский", () => {
		const text = "schrefoyvashfyvefdauezuekhfyv";
		const result = getOtherLanguageStr(text, converterToRus);

		expect(result).toEqual("щрефойвашфйвефдауезуехфйв");
	});
});
