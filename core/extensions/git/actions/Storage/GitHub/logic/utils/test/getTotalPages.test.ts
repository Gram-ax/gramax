import getTotalPages from "@ext/git/actions/Storage/GitHub/logic/utils/getTotalPages";

describe("getTotalPages парсит параметр Link", () => {
	test(`Без параметра "per_page"`, () => {
		const link = `<https://api.github.com/user/repos?per_page=10&page=1>; rel="prev",
 <https://api.github.com/user/repos?per_page=10&page=3>; rel="next",
 <https://api.github.com/user/repos?per_page=10&page=4>; rel="last",
 <https://api.github.com/user/repos?per_page=10&page=1>; rel="first"`;

		expect(getTotalPages(link)).toEqual(4);
	});
	test(`С параметром "per_page"`, () => {
		const link = `<https://api.github.com/user/repos?&page=1>; rel="prev",
        <https://api.github.com/user/repos?&page=3>; rel="next",
        <https://api.github.com/user/repos?&page=4>; rel="last",
        <https://api.github.com/user/repos?&page=1>; rel="first"`;

		expect(getTotalPages(link)).toEqual(4);
	});
	test(`На последней странице из нескольких`, () => {
		const link = `<https://api.github.com/user/repos?sort=updated&per_page=10&page=4>; rel="prev", 
		<https://api.github.com/user/repos?sort=updated&per_page=10&page=1>; rel="first"`;

		expect(getTotalPages(link)).toEqual(5);
	});
	test("Если не передать строку", () => {
		expect(getTotalPages(undefined)).toEqual(1);
	});
});
