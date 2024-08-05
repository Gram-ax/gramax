import parseStorageUrl from "../parseStorageUrl";

describe("ParseStorageUrl", () => {
	describe("Парсит", () => {
		describe("HTTP ссылку", () => {
			test("С .git", () => {
				const link = "https://domain.com/group1/group2/g3/g4/name.git";
				const parsedLink = {
					protocol: "https",
					domain: "domain.com",
					group: "group1/group2/g3/g4",
					name: "name",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без .git", () => {
				const link = "https://domain.com/group1/group2/g3/g4/name";
				const parsedLink = {
					protocol: "https",
					domain: "domain.com",
					group: "group1/group2/g3/g4",
					name: "name",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "https://domain.com/name.git";
				const parsedLink = { protocol: "https", domain: "domain.com", group: undefined, name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Confluence", () => {
				const link = "https://domain.atlassian.net/";
				const parsedLink = {
					protocol: "https",
					domain: "domain.atlassian.net",
					group: undefined,
					name: undefined,
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});
		describe("HTTP ссылку без s", () => {
			test("С .git", () => {
				const link = "http://domain.com/group1/group2/g3/g4/name.git";
				const parsedLink = {
					protocol: "http",
					domain: "domain.com",
					group: "group1/group2/g3/g4",
					name: "name",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без .git", () => {
				const link = "http://domain.com/group1/group2/g3/g4/name";
				const parsedLink = {
					protocol: "http",
					domain: "domain.com",
					group: "group1/group2/g3/g4",
					name: "name",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "http://domain.com/name.git";
				const parsedLink = { protocol: "http", domain: "domain.com", group: undefined, name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Confluence", () => {
				const link = "http://domain.atlassian.net/";
				const parsedLink = {
					protocol: "http",
					domain: "domain.atlassian.net",
					group: undefined,
					name: undefined,
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});
		describe("SSH ссылку", () => {
			test("С .git", () => {
				const link = "git@domain.ics-it.com:group1/group2/name.git";
				const parsedLink = {
					protocol: "git@",
					domain: "domain.ics-it.com",
					group: "group1/group2",
					name: "name",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без .git", () => {
				const link = "git@domain.com:group1/group2/name";
				const parsedLink = { protocol: "git@", domain: "domain.com", group: "group1/group2", name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "git@domain.com:name.git";
				const parsedLink = { protocol: "git@", domain: "domain.com", group: undefined, name: "name" };

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});
		test("Ссылку без протоколов", () => {
			const link = "domain.com/group1/group2/g3/g4/name.git";
			const parsedLink = {
				protocol: undefined,
				domain: "domain.com",
				group: "group1/group2/g3/g4",
				name: "name",
			};

			const result = parseStorageUrl(link);

			expect(result).toEqual(parsedLink);
		});
		test("Просто домен", () => {
			const link = "domain.com";
			const parsedLink = { protocol: undefined, domain: "domain.com", group: undefined, name: undefined };

			const result = parseStorageUrl(link);

			expect(result).toEqual(parsedLink);
		});
	});
	test("Не парсит неправильную ссылку", () => {
		const link = "httttt://wrong_link_qwerty";

		const result = parseStorageUrl(link);

		expect(result).toEqual({ protocol: undefined, domain: undefined, group: undefined, name: undefined });
	});
});
