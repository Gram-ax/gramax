import Url from "@core-ui/ApiServices/Types/Url";
import { parseLinkHref } from "@core-ui/utils/parseLinkhref";

describe("parseLinkHref", () => {
	it.each([
		["article", "/article"],
		["catalog/article", "/catalog/article"],
		["/catalog/article", "/catalog/article"],
		["#heading", "#heading"],
		["?view=table", "?view=table"],
		["", "/"],
	])("normalizes pathname %j to %j", (pathname, expected) => {
		expect(parseLinkHref(Url.from({ pathname }))).toBe(expected);
	});
});
