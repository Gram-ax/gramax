import parseStorageUrl from "../parseStorageUrl";

describe("ParseStorageUrl", () => {
	describe("Парсит", () => {
		describe("HTTP ссылку", () => {
			test("С .git", () => {
				const link = "https://domain.com/group1/group2/g3/g4/name.git";
				const parsedLink = { domain: "domain.com", group: "group1/group2/g3/g4", name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без .git", () => {
				const link = "https://domain.com/group1/group2/g3/g4/name";
				const parsedLink = { domain: "domain.com", group: "group1/group2/g3/g4", name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "https://domain.com/name.git";
				const parsedLink = { domain: "domain.com", group: undefined, name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Confluence", () => {
				const link = "https://domain.atlassian.net/";
				const parsedLink = { domain: "domain.atlassian.net", group: undefined, name: undefined };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});
		describe("SSH ссылку", () => {
			test("С .git", () => {
				const link = "git@domain.ics-it.com:group1/group2/name.git";
				const parsedLink = { domain: "domain.ics-it.com", group: "group1/group2", name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без .git", () => {
				const link = "git@domain.com:group1/group2/name";
				const parsedLink = { domain: "domain.com", group: "group1/group2", name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "git@domain.com:name.git";
				const parsedLink = { domain: "domain.com", group: undefined, name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});
		test("Ссылку без протоколов", () => {
			const link = "domain.com/group1/group2/g3/g4/name.git";
			const parsedLink = { domain: "domain.com", group: "group1/group2/g3/g4", name: "name" };

			const result = parseStorageUrl(link);

			expect(result).toEqual(parsedLink);
		});
		test("Просто домен", () => {
			const link = "domain.com";
			const parsedLink = { domain: "domain.com", group: undefined, name: undefined };

			const result = parseStorageUrl(link);

			expect(result).toEqual(parsedLink);
		});
	});
	test("Не парсит неправильную ссылку", () => {
		const link = "httttt://wrong_link_qwerty";

		const result = parseStorageUrl(link);

		expect(result).toEqual({ domain: undefined, group: undefined, name: undefined });
	});
});
