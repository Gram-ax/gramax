import { getHttpSrc } from "./utils";

describe("Нормализация URL", () => {
	it("заменяет обратные слэши в https-ссылке на прямые", () => {
		const input = "https:\\\\static.example.com\\images\\logo.png";
		const expected = "https:/static.example.com/images/logo.png";
		expect(getHttpSrc(input)).toBe(expected);
	});

	it("схлопывает несколько подряд идущих слэшей до одного", () => {
		const input = "https://static.example.com///images//logo.png";
		const expected = "https:/static.example.com/images/logo.png";
		expect(getHttpSrc(input)).toBe(expected);
	});

	it("обрабатывает смешанные прямые и обратные слэши", () => {
		const input = "https:\\\\static.example.com//\\images\\\\//logo.png";
		const expected = "https:/static.example.com/images/logo.png";
		expect(getHttpSrc(input)).toBe(expected);
	});

	it("минимально сохраняет структуру протокола", () => {
		const input = "http:\\\\cdn.site.com\\\\assets////img.png";
		const expected = "http:/cdn.site.com/assets/img.png";
		expect(getHttpSrc(input)).toBe(expected);
	});

	it("не изменяет уже корректный URL", () => {
		const input = "https:/static.example.com/images/logo.png";
		expect(getHttpSrc(input)).toBe(input);
	});

	it("удаляет повторяющиеся слэши после домена", () => {
		const input = "https://domain.com//folder///file.jpg";
		const expected = "https:/domain.com/folder/file.jpg";
		expect(getHttpSrc(input)).toBe(expected);
	});

	it('обрабатывает комбинацию прямого и обратного слэша ("/\\") как один слэш', () => {
		const input = "/\\";
		const expected = "/";
		expect(getHttpSrc(input)).toBe(expected);
	});

	it("обрабатывает длинную ссылку со статическим ресурсом от Яндекса", () => {
		const input =
			"https:\\\\yandex.ru\\support\\wiki\\docs-assets\\support-wiki///rev//r16106408/ru/\\_assets/result.png";
		const expected = "https:/yandex.ru/support/wiki/docs-assets/support-wiki/rev/r16106408/ru/_assets/result.png";
		expect(getHttpSrc(input)).toBe(expected);
	});
});
