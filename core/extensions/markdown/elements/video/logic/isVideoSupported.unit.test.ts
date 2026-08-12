import isVideoSupported from "./isVideoSupported";

describe("isVideoSupported", () => {
	it.each([
		["youtube", "https://www.youtube.com/watch?v=abc"],
		["youtu.be", "https://youtu.be/abc"],
		["google drive", "https://drive.google.com/file/d/abc/view"],
		["mega", "https://mega.nz/file/abc"],
		["rutube", "https://rutube.ru/video/abc/"],
		["dropbox", "https://www.dropbox.com/s/abc/clip.mp4?dl=0"],
		["instagram reel", "https://www.instagram.com/reel/Cabc123/"],
		["instagram post", "https://www.instagram.com/p/Cabc123/"],
	])("recognizes %s", (_, url) => {
		expect(isVideoSupported(url)).toBe(true);
	});

	it("rejects an unrelated link", () => {
		expect(isVideoSupported("https://example.com/page")).toBe(false);
	});
});
