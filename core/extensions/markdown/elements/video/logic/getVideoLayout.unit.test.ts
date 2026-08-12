import getVideoLayout from "./getVideoLayout";

describe("getVideoLayout", () => {
	it.each([
		["youtube shorts", "https://www.youtube.com/shorts/abc123", "vertical"],
		["youtube shorts with query", "https://youtube.com/shorts/abc123?feature=share", "vertical"],
		["mobile youtube shorts", "https://m.youtube.com/shorts/abc123", "vertical"],
		["instagram reel", "https://www.instagram.com/reel/Cabc123/", "vertical"],
		["instagram reels", "https://instagram.com/reels/Cabc123/", "vertical"],
		["instagram profile reel", "https://www.instagram.com/some.user/reel/Cabc123/", "vertical"],
		["regular youtube", "https://www.youtube.com/watch?v=abc123", "horizontal"],
		["short youtube link", "https://youtu.be/abc123", "horizontal"],
		["instagram post", "https://www.instagram.com/p/Cabc123/", "horizontal"],
		["unrelated url", "https://example.com/shorts/abc123", "horizontal"],
		["malformed url", "not a url", "horizontal"],
	] as const)("returns %s layout for %s", (_name, url, expected) => {
		expect(getVideoLayout(url)).toBe(expected);
	});
});
