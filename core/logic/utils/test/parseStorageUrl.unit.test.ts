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
					origin: "https://domain.com",
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
					origin: "https://domain.com",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "https://domain.com/name.git";
				const parsedLink = {
					protocol: "https",
					domain: "domain.com",
					group: null,
					name: "name",
					origin: "https://domain.com",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Confluence", () => {
				const link = "https://domain.atlassian.net/";
				const parsedLink = {
					protocol: "https",
					domain: "domain.atlassian.net",
					group: null,
					name: null,
					origin: "https://domain.atlassian.net",
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
					origin: "http://domain.com",
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
					origin: "http://domain.com",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "http://domain.com/name.git";
				const parsedLink = {
					protocol: "http",
					domain: "domain.com",
					group: null,
					name: "name",
					origin: "http://domain.com",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Confluence", () => {
				const link = "http://domain.atlassian.net/";
				const parsedLink = {
					protocol: "http",
					domain: "domain.atlassian.net",
					group: null,
					name: null,
					origin: "http://domain.atlassian.net",
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
					origin: "git@domain.ics-it.com",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без .git", () => {
				const link = "git@domain.com:group1/group2/name";
				const parsedLink = {
					protocol: "git@",
					domain: "domain.com",
					group: "group1/group2",
					name: "name",
					origin: "git@domain.com",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
			test("Без группы", () => {
				const link = "git@domain.com:name.git";
				const parsedLink = {
					protocol: "git@",
					domain: "domain.com",
					group: null,
					name: "name",
					origin: "git@domain.com",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});
		test("Ссылку без протоколов", () => {
			const link = "domain.com/group1/group2/g3/g4/name.git";
			const parsedLink = {
				protocol: "https",
				domain: "domain.com",
				group: "group1/group2/g3/g4",
				name: "name",
				origin: "https://domain.com",
			};

			const result = parseStorageUrl(link);

			expect(result).toEqual(parsedLink);
		});
		test("Просто домен", () => {
			const link = "domain.com";
			const parsedLink = {
				protocol: "https",
				domain: "domain.com",
				group: null,
				name: null,
				origin: "https://domain.com",
			};

			const result = parseStorageUrl(link);

			expect(result).toEqual(parsedLink);
		});
	});
	describe("Ссылки с портом", () => {
		describe("HTTP ссылку с портом", () => {
			test("HTTP с портом 8080", () => {
				const link = "http://domain.com:8080/group1/group2/name.git";
				const parsedLink = {
					protocol: "http",
					domain: "domain.com:8080",
					group: "group1/group2",
					name: "name",
					origin: "http://domain.com:8080",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});

			test("HTTP с нестандартным портом", () => {
				const link = "http://domain.com:3000/group1/group2/name";
				const parsedLink = {
					protocol: "http",
					domain: "domain.com:3000",
					group: "group1/group2",
					name: "name",
					origin: "http://domain.com:3000",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});

		describe("HTTPS ссылку с портом", () => {
			test("HTTPS с портом 8443", () => {
				const link = "https://domain.com:8443/group1/group2/name.git";
				const parsedLink = {
					protocol: "https",
					domain: "domain.com:8443",
					group: "group1/group2",
					name: "name",
					origin: "https://domain.com:8443",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});

			test("HTTPS с нестандартным портом", () => {
				const link = "https://domain.com:9443/group1/group2/name";
				const parsedLink = {
					protocol: "https",
					domain: "domain.com:9443",
					group: "group1/group2",
					name: "name",
					origin: "https://domain.com:9443",
				};

				const result = parseStorageUrl(link);

				expect(result).toEqual(parsedLink);
			});
		});
	});
});
