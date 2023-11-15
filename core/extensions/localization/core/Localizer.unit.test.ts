import { Localizer } from "./Localizer";
import Language, { defaultLanguage } from "./model/Language";

const localizer = new Localizer(Language.ru);

export default describe("Localization", () => {
	describe("обрезает язык из:", () => {
		test("/en/path/path2", () => expect(localizer.trim("/en/path/path2")).toEqual("/path/path2"));

		test("en/path", () => expect(localizer.trim("en/path")).toEqual("/path"));

		test("/path", () => expect(localizer.trim("/path")).toEqual("/path"));

		test("/en", () => expect(localizer.trim("/en")).toEqual("/"));

		test("en", () => expect(localizer.trim("en")).toEqual("/"));
	});

	describe("получает язык из:", () => {
		test("/en/path", () => expect(localizer.extract("/en/path")).toEqual(Language.en));

		test("ru/path", () => expect(localizer.extract("ru/path")).toEqual(Language.ru));

		test("/path", () => expect(localizer.extract("/path")).toEqual(defaultLanguage));
	});

	describe("добавляет префикс:", () => {
		test("en + /en/path", () => expect(localizer.addPrefix("/en/path", Language.en)).toEqual("/en/path"));

		test("ru + /en/path", () => expect(localizer.addPrefix("/en/path", Language.ru)).toEqual("/path"));

		test("ru + /path", () => expect(localizer.addPrefix("/path", Language.ru)).toEqual("/path"));
	});

	describe("трансформирует:", () => {
		test("/en/path + /ru/path", () => expect(localizer.sanitizePrefix("/ru/path", "/en/path")).toEqual("/path"));

		test("/path + /ru/path", () => expect(localizer.sanitizePrefix("/ru/path", "/path")).toEqual("/path"));

		test("/en/path + /path", () => expect(localizer.sanitizePrefix("/path", "/en/path")).toEqual("/en/path"));

		test("/path + /path", () => expect(localizer.sanitizePrefix("/path", "/path")).toEqual("/path"));

		test("/en/ + /", () => expect(localizer.sanitizePrefix("/", "/en/")).toEqual("/en/"));

		test("/ + /en/", () => expect(localizer.sanitizePrefix("/en/", "/")).toEqual("/en/"));

		test("/en + /ru", () => expect(localizer.sanitizePrefix("/ru", "/en")).toEqual("/"));
	});
});
