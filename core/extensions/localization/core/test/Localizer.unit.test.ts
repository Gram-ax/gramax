import { ContentLanguage } from "@ext/localization/core/model/Language";
import Localizer, { type AddLanguagePath, type AddLanguagePathname } from "../Localizer";

describe("Localization", () => {
	describe("extract", () => {
		test("должен вернуть правильный ContentLanguage", () => {
			const cases = {
				"/catalog/en/some/path": ContentLanguage.en,
				"/catalog/ru/some/path": ContentLanguage.ru,
				"/catalog/some/path": undefined,
			};

			for (const [test, expected] of Object.entries(cases)) {
				expect(Localizer.extract(test)).toEqual(expected);
			}
		});
	});

	describe("addPathname", () => {
		test("должен вернуть правильный pathname, когда primaryLanguage совпадает с current", () => {
			const params: AddLanguagePathname = {
				logicPath: "catalog/some/path",
				pathname: "git/group/catalog/master/-/some/path",
				target: ContentLanguage.en,
				current: ContentLanguage.ru,
				primaryLanguage: ContentLanguage.ru,
			};

			const result = Localizer.addPathname(params);
			expect(result).toBe("git/group/catalog/master/-/en/some/path");
		});

		test("должен вернуть правильный pathname, когда primaryLanguage не совпадает с current", () => {
			const params: AddLanguagePathname = {
				logicPath: "catalog/some/path",
				pathname: "git/group/catalog/master/-/fr/some/path",
				target: ContentLanguage.ru,
				current: ContentLanguage.fr,
				primaryLanguage: ContentLanguage.ru,
			};
			expect(Localizer.addPathname(params)).toBe("git/group/catalog/master/-/some/path");
		});
	});

	describe("addPath", () => {
		test("должен вернуть правильный путь, когда primaryLanguage совпадает с current", () => {
			const params: AddLanguagePath = {
				logicPath: "catalog/some/path",
				target: ContentLanguage.en,
				current: ContentLanguage.ru,
				primaryLanguage: ContentLanguage.ru,
			};
			expect(Localizer.addPath(params)).toBe("/catalog/en/some/path");
		});

		test("должен вернуть правильный путь, когда primaryLanguage не совпадает с current", () => {
			const params: AddLanguagePath = {
				logicPath: "catalog/fr/some/path",
				target: ContentLanguage.ar,
				current: ContentLanguage.fr,
				primaryLanguage: ContentLanguage.ru,
			};
			expect(Localizer.addPath(params)).toBe("/catalog/ar/some/path");
		});
	});

	describe("trim", () => {
		test("должен удалить язык из пути, если он поддерживается", () => {
			const cases = {
				"catalog/fr/some/path": "catalog/some/path",
				"catalog/some/path": "catalog/some/path",
			};

			for (const [test, expected] of Object.entries(cases)) {
				expect(Localizer.trim(test, [ContentLanguage.fr])).toEqual(expected);
			}
		});
	});
});
