import en from "@ext/localization/locale/locale.en";
import ru from "@ext/localization/locale/locale.ru";
import buildOpenApiMessages from "@ext/markdown/elements/openApi/render/openApiMessages";

type Dictionary = Record<string, string>;

const enOpenApi = en.openApi as unknown as Dictionary;
const ruOpenApi = ru.openApi as unknown as Dictionary;

// Panel diagnostics are localized by machine `code`: the core looks a code up in `messages`, and Gramax
// fills `messages` from these keys. A key present in one language only silently falls back to English.
const diagnosticKeys = Object.keys(enOpenApi).filter((key) => key.startsWith("diagnostic"));

const placeholders = (text: string): string[] => (text.match(/\{\w+\}/g) ?? []).sort();

describe("OpenAPI diagnostic templates (U4 panel)", () => {
	test("the localized set is not empty", () => {
		expect(diagnosticKeys.length).toBeGreaterThan(20);
	});

	test("every template exists in both RU and EN", () => {
		for (const key of diagnosticKeys) {
			expect(typeof ruOpenApi[key]).toBe("string");
			expect(ruOpenApi[key]).not.toHaveLength(0);
			expect(enOpenApi[key]).not.toHaveLength(0);
		}
		expect(Object.keys(ruOpenApi).filter((key) => key.startsWith("diagnostic"))).toEqual(diagnosticKeys);
	});

	test("every template reaches the core through buildOpenApiMessages", () => {
		const messages = buildOpenApiMessages() as unknown as Dictionary;
		for (const key of diagnosticKeys) expect(messages[key]).toBe(enOpenApi[key]);
	});

	test("the unsupported-version template renders the version itself in both languages", () => {
		expect(enOpenApi.diagnosticVersionUnsupported).toContain("{received}");
		expect(ruOpenApi.diagnosticVersionUnsupported).toContain("{received}");
	});
});

describe("OpenAPI UI chrome dictionary", () => {
	const flatKeys = (dictionary: Dictionary): string[] =>
		Object.keys(dictionary)
			.filter((key) => typeof dictionary[key] === "string")
			.sort();

	test("RU and EN carry the same keys", () => {
		expect(flatKeys(ruOpenApi)).toEqual(flatKeys(enOpenApi));
	});

	test("every localized key reaches the core through buildOpenApiMessages", () => {
		const messages = buildOpenApiMessages() as unknown as Dictionary;
		for (const key of flatKeys(enOpenApi)) expect(messages[key]).toBe(enOpenApi[key]);
	});

	test("both languages substitute the same placeholders", () => {
		for (const key of flatKeys(enOpenApi)) {
			expect(placeholders(ruOpenApi[key])).toEqual(placeholders(enOpenApi[key]));
		}
	});
});

// These are the strings a reader sees once Try it is on. Pinning both languages keeps a well-meaning reword
// from silently changing the contract.
describe("Try it mode wording", () => {
	const table: [key: string, ru: string, en: string][] = [
		["curlTitle", "cURL", "cURL"],
		["modeDescribe", "Обзор", "Overview"],
		["modeExecute", "Попробовать", "Try it"],
		["executeRequestButton", "Отправить", "Send"],
		["executeSendingButton", "Отправляем…", "Sending…"],
		["cookieParamsNotice", "Try не отправит cookie-параметры", "Try does not send cookie parameters"],
		[
			"cookieParamsNoticeDetail",
			"Введённые значения будут добавлены только в сгенерированную команду curl.",
			"Entered values are included only in the generated curl command.",
		],
		["requiredFieldError", "Обязательное поле", "Required field"],
		["requestFailedTitle", "Не удалось получить ответ", "Couldn’t get a response"],
		[
			"requestFailedHint",
			"API недоступен или запрос был заблокирован. Проверьте URL сервера или попробуйте команду curl выше.",
			"The API is unavailable or the request was blocked. Check the server URL or try the curl command above.",
		],
		["secretShow", "Показать значение", "Show value"],
		["secretHide", "Скрыть значение", "Hide value"],
		["authorizationTitle", "Авторизация", "Authorization"],
		["resultHeading", "Ответ", "Response"],
		["requestDetailsLabel", "Детали запроса", "Request details"],
		["clearButton", "Очистить", "Clear"],
		["serverSelectAriaLabel", "Сервер", "Server"],
	];

	test.each(table)("%s reads %s in RU and %s in EN", (key, ru, en) => {
		expect(ruOpenApi[key]).toBe(ru);
		expect(enOpenApi[key]).toBe(en);
	});
});

describe("Inline metadata wording", () => {
	const table: [key: string, ru: string, en: string][] = [
		["paramDefaultLabel", "По умолчанию", "Default"],
		["paramExampleLabel", "Пример", "Example"],
		["parametersPrefix", "Параметры следующего вызова:", "Target parameters:"],
		["requestBodyPrefix", "Тело следующего запроса:", "Target request body:"],
	];

	test.each(table)("%s reads %s in RU and %s in EN", (key, ru, en) => {
		expect(ruOpenApi[key]).toBe(ru);
		expect(enOpenApi[key]).toBe(en);
	});
});

describe("OpenAPI error block texts (U1-U3)", () => {
	const enErrors = enOpenApi.errors as unknown as Dictionary;
	const ruErrors = ruOpenApi.errors as unknown as Dictionary;

	test("RU and EN carry the same keys", () => {
		expect(Object.keys(ruErrors).sort()).toEqual(Object.keys(enErrors).sort());
	});

	test("both languages substitute the same placeholders", () => {
		for (const key of Object.keys(enErrors)) {
			expect(placeholders(ruErrors[key])).toEqual(placeholders(enErrors[key]));
		}
	});

	test("U1 names the file and U2 names the format and position", () => {
		expect(placeholders(enErrors.missing)).toEqual(["{path}"]);
		expect(placeholders(enErrors.empty)).toEqual(["{path}"]);
		expect(placeholders(enErrors.syntax)).toEqual(["{column}", "{format}", "{line}"]);
	});
});
