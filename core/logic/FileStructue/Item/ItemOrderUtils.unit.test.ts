import { digitsAfterDot, roundedOrderAfter } from "@core/FileStructue/Item/ItemOrderUtils";

describe("Генерация order с округлением", () => {
	test("после 1", () => expect(roundedOrderAfter([1, 2, 3], 1)).toBe(1.5));
	test("после 1.5", () => expect(roundedOrderAfter([1, 1.5, 2, 3], 1.5)).toBe(1.8));
	test("до 1.5", () => expect(roundedOrderAfter([1, 1.5], 1)).toBe(1.3));
	test("после 2", () => expect(roundedOrderAfter([1, 2, 3], 2)).toBe(2.5));
	test("после 0.5", () => expect(roundedOrderAfter([0.2, 0.5, 0.7], 0.5)).toBe(0.6));
	test("в начале перед 1", () => expect(roundedOrderAfter([1], 0)).toBe(0.5));
	test("в начале перед 0.5", () => expect(roundedOrderAfter([0.5, 1], 0)).toBe(0.3));
	test("в конце после 2", () => expect(roundedOrderAfter([1, 2], 2)).toBe(3));
	test("в конце после 2.5", () => expect(roundedOrderAfter([1, 2.5], 2.5)).toBe(3.5));
	test("между 0 и 0.25", () => expect(roundedOrderAfter([0, 0.25], 0)).toBe(0.14));

	test("между 2.98 и 3", () => expect(roundedOrderAfter([2.98, 3], 2.98)).toBe(2.99));
});

describe("Подсчёт количества цифр после запятой", () => {
	test("0.001", () => expect(digitsAfterDot(0.001)).toBe(3));
	test("12344321.12", () => expect(digitsAfterDot(12344321.12)).toBe(2));
	test("15", () => expect(digitsAfterDot(15)).toBe(0));
});
