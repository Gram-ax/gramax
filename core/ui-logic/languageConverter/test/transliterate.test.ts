import { transliterate } from "@core-ui/languageConverter/transliterate";

describe("transliterate", () => {
	test("с русского на английский", () => expect(transliterate("привет")).toEqual("privet"));

	test("с русского на английский (kebab)", () =>
		expect(transliterate("Привет, Мир!1", { kebab: true })).toEqual("privet-mir-1"));

	test("с английского на русский", () => expect(transliterate("privet", { targetLanguage: "ru" })).toEqual("привет"));

	test("с английского на русский (kebab)", () =>
		expect(transliterate("Privet, Mir!", { targetLanguage: "ru", kebab: true })).toEqual("привет-мир"));

	test("убирает ненужные символы (kebab)", () => expect(transliterate("те真ст真", { kebab: true })).toEqual("te-st"));
});
