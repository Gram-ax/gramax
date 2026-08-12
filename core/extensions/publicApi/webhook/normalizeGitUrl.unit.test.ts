import normalizeGitUrl from "./normalizeGitUrl";

describe("normalizeGitUrl", () => {
	it("normalizes https URL with .git", () => {
		expect(normalizeGitUrl("https://gitlab.example.com/group/repo.git")).toBe("gitlab.example.com/group/repo");
	});
	it("normalizes scp-style ssh URL", () => {
		expect(normalizeGitUrl("git@gitlab.example.com:group/repo.git")).toBe("gitlab.example.com/group/repo");
	});
	it("normalizes ssh:// URL", () => {
		expect(normalizeGitUrl("ssh://git@gitlab.example.com/group/repo.git")).toBe("gitlab.example.com/group/repo");
	});
	it("strips port", () => {
		expect(normalizeGitUrl("https://gitlab.example.com:8443/group/repo.git")).toBe("gitlab.example.com/group/repo");
	});
	it("strips trailing slash and lowercases", () => {
		expect(normalizeGitUrl("HTTPS://GitLab.Example.com/Group/Repo/")).toBe("gitlab.example.com/group/repo");
	});
	it("equal canonical form for ssh and https of same repo", () => {
		expect(normalizeGitUrl("git@host.com:g/r.git")).toBe(normalizeGitUrl("https://host.com/g/r"));
	});
	it("returns null for empty input", () => {
		expect(normalizeGitUrl("")).toBeNull();
		expect(normalizeGitUrl(undefined)).toBeNull();
	});
});
