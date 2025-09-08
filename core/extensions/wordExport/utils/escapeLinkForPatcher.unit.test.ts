import { escapeLinkForPatcher } from "./escapeLinkForPatcher";

describe("escapeLinkForPatcher", () => {
	it("should escape ampersand", () => {
		const url =
			"https://www.pgconfig.org/#/?max_connections=100&pg_version=16&environment_name=WEB&total_ram=4&cpus=2&drive_type=SSD&arch=x86-64&os_type=linux";
		const expected =
			"https://www.pgconfig.org/#/?max_connections=100&amp;pg_version=16&amp;environment_name=WEB&amp;total_ram=4&amp;cpus=2&amp;drive_type=SSD&amp;arch=x86-64&amp;os_type=linux";
		const result = escapeLinkForPatcher(url);
		expect(result).toBe(expected);
	});

	it("should not double escape already escaped url", () => {
		const onceEscaped = "https://example.com?a=1&amp;b=2";
		expect(escapeLinkForPatcher(onceEscaped)).toBe(onceEscaped);
	});
});
