import { getLinkToHeading } from "./getLinkToHeading";

describe("getLinkToHeading", () => {
	test("returns null when href does not contain hash", () => {
		expect(getLinkToHeading("./article.md")).toBeNull();
	});

	test("splits path and hash at the first hash symbol", () => {
		expect(getLinkToHeading("./article.md#шаг-1#шаг-1.-первый-заголовок")).toEqual({
			path: "./article.md",
			hash: "#шаг-1#шаг-1.-первый-заголовок",
		});
	});
});
