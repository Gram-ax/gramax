import { getUrlFileExtension } from "./getUrlFileExtension";

describe("getUrlFileExtension", () => {
	it.each([
		["plain mp4", "https://cdn.example.com/video.mp4", "mp4"],
		["webm with hash", "https://example.com/a/b/c.webm#t=10", "webm"],
		["uppercase OGG", "https://example.com/track.OGG", "ogg"],
		["filename with dots", "https://example.com/my.video.final.mp4?x=1", "mp4"],
		["query params long", "https://example.com/file.webm?foo=1&bar=2", "webm"],
		["relative path", "/assets/media/clip.webm?autoplay=1", "webm"],
		[
			"dropbox-like mp4 with tracking params",
			"https://dl.dropboxusercontent.com/s/abc123/file.mp4?rlkey=tipmpzh06bifysuybamhm23ok&e=1&st=279cjlei&dl=0",
			"mp4",
		],
	])("%s", (_, url, expected) => {
		expect(getUrlFileExtension(url)).toBe(expected);
	});
});
