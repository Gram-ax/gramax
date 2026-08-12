import matchGitAttributesPattern from "@core/GitLfs/logic/matchGitAttributesPattern";

describe("matchGitAttributesPattern", () => {
	test("basename pattern without slash matches in any directory", () => {
		expect(matchGitAttributesPattern("*.psd", "img.psd")).toBe(true);
		expect(matchGitAttributesPattern("*.psd", "dir/img.psd")).toBe(true);
		expect(matchGitAttributesPattern("*.psd", "dir/sub/img.psd")).toBe(true);
	});

	test("basename pattern is case-sensitive", () => {
		expect(matchGitAttributesPattern("*.psd", "img.psD")).toBe(false);
	});

	test("basename pattern does not match extra suffix", () => {
		expect(matchGitAttributesPattern("*.psd", "img.psdx")).toBe(false);
	});

	test("pattern with slash matches full relative path, per-segment glob", () => {
		expect(matchGitAttributesPattern("assets/*.png", "assets/a.png")).toBe(true);
		expect(matchGitAttributesPattern("assets/*.png", "other/a.png")).toBe(false);
		expect(matchGitAttributesPattern("assets/*.png", "assets/sub/a.png")).toBe(false);
	});

	test("leading slash on pattern is stripped, still anchored to root", () => {
		expect(matchGitAttributesPattern("/assets/*.png", "assets/a.png")).toBe(true);
		expect(matchGitAttributesPattern("/assets/*.png", "other/assets/a.png")).toBe(false);
	});

	test("? matches exactly one char, not a slash", () => {
		expect(matchGitAttributesPattern("img?.psd", "img1.psd")).toBe(true);
		expect(matchGitAttributesPattern("img?.psd", "img12.psd")).toBe(false);
		expect(matchGitAttributesPattern("a?b", "a/b")).toBe(false);
	});

	test("regex special characters in pattern are treated literally", () => {
		expect(matchGitAttributesPattern("file(1).png", "file(1).png")).toBe(true);
		expect(matchGitAttributesPattern("file(1).png", "fileX1X.png")).toBe(false);
		expect(matchGitAttributesPattern("a+b.txt", "a+b.txt")).toBe(true);
	});
});
