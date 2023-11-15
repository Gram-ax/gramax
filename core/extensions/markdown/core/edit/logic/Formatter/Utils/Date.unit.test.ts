import { dateNormalize, dateScreening } from "./Date";

describe("CommentDateUtils успешно ", () => {
	test("экранирует дату", () => {
		const testDate = "2022-09-07T07:02:16.104Z";

		const screnTestDate = dateScreening(testDate);

		expect(screnTestDate).toEqual("2022-09-07T07|02|16.104Z");
	});

	test("нормализует дату", () => {
		const testDate = "2022-09-07T07|02|16.104Z";

		const screnTestDate = dateNormalize(testDate);

		expect(screnTestDate).toEqual("2022-09-07T07:02:16.104Z");
	});
});
