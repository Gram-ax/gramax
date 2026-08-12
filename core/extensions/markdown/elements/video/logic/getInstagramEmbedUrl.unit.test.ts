import getInstagramEmbedUrl from "./getInstagramEmbedUrl";

describe("getInstagramEmbedUrl", () => {
	it.each([
		["reel", "https://www.instagram.com/reel/Cabc123/", "https://www.instagram.com/reel/Cabc123/embed"],
		["post", "https://www.instagram.com/p/Cabc123/", "https://www.instagram.com/p/Cabc123/embed"],
		["igtv", "https://www.instagram.com/tv/Cabc123/", "https://www.instagram.com/tv/Cabc123/embed"],
		[
			"reel with tracking query",
			"https://www.instagram.com/reel/Cabc123/?igsh=abc&utm_source=ig_web",
			"https://www.instagram.com/reel/Cabc123/embed",
		],
		[
			"reel under a profile",
			"https://www.instagram.com/some.user/reel/Cabc123/",
			"https://www.instagram.com/reel/Cabc123/embed",
		],
		[
			"reels plural normalized to reel",
			"https://www.instagram.com/reels/Cabc123/",
			"https://www.instagram.com/reel/Cabc123/embed",
		],
		["no www", "https://instagram.com/p/Cabc123", "https://www.instagram.com/p/Cabc123/embed"],
	])("%s", (_, url, expected) => {
		expect(getInstagramEmbedUrl(url)).toBe(expected);
	});

	it("returns the url unchanged when it is not a recognizable instagram media link", () => {
		const url = "https://www.instagram.com/some.user/";
		expect(getInstagramEmbedUrl(url)).toBe(url);
	});
});
