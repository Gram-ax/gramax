import fnProperties from "./fnProperties";
import { icsAccount } from "./functions/icsAccount/icsAccount";

describe("Функциональный блок.", () => {
	describe("Параметры функциональных блоков. ", () => {
		describe("Предопределенные функции", () => {
			test("не возвращают нулевое значение", () => {
				const fnKeys = Object.values(fnProperties);

				const responses = fnKeys.map((fnProps) => fnProps.func(null as any));
				const isNullResponse = responses.some((response) => !response);

				expect(isNullResponse).toEqual(false);
			});
		});
	});

	describe("icsAccount", () => {
		test("трансформирует фамилию и имя на русском в английский, а также формирует email и логин", () => {
			const passedValue = { fullName: "Яргунькин Станислав" };

			const response = icsAccount(passedValue);

			expect(response).toEqual({
				fullName: "Yargunkin Stanislav",
				email: "yargunkin.stanislav@ics-it.ru",
				login: "yargunkin.stanislav",
			});
		});
	});
});
