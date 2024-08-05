import mergeObjects from "@core/utils/mergeObjects";

describe("mergeObjects", () => {
	test(`правильно объединяет многоуровневые объекты`, () => {
		const obj1 = { a: 1, b: { b1: 2, b2: { b21: 3 } }, c: 4 };
		const obj2 = { a: 10, b: { b1: 20, b2: { b21: 30, b22: 40 }, b3: 50 }, d: 60 };

		const result = mergeObjects(obj1, obj2);

		expect(result).toEqual({ a: 10, b: { b1: 20, b2: { b21: 30, b22: 40 }, b3: 50 }, c: 4, d: 60 });
		expect(result === obj1).toBeFalsy();
		expect(result === obj2).toBeFalsy();
	});
});
