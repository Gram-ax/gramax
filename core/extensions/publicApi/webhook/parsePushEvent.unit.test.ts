import parsePushEvent from "./parsePushEvent";

describe("parsePushEvent", () => {
	it("parses GitHub push payload", () => {
		const body = {
			ref: "refs/heads/main",
			repository: {
				ssh_url: "git@github.com:org/repo.git",
				clone_url: "https://github.com/org/repo.git",
			},
		};
		expect(parsePushEvent("github", body)).toEqual({
			repoUrls: ["git@github.com:org/repo.git", "https://github.com/org/repo.git"],
			branch: "main",
		});
	});

	it("parses GitLab push payload", () => {
		const body = {
			ref: "refs/heads/release/1.0",
			project: {
				git_ssh_url: "git@gitlab.com:org/repo.git",
				git_http_url: "https://gitlab.com/org/repo.git",
			},
		};
		expect(parsePushEvent("gitlab", body)).toEqual({
			repoUrls: ["git@gitlab.com:org/repo.git", "https://gitlab.com/org/repo.git"],
			branch: "release/1.0",
		});
	});

	it("returns null branch for tag push", () => {
		const body = { ref: "refs/tags/v1.0", repository: { ssh_url: "a", clone_url: "b" } };
		expect(parsePushEvent("github", body)?.branch).toBeNull();
	});

	it("returns null for malformed body", () => {
		expect(parsePushEvent("github", null)).toBeNull();
		expect(parsePushEvent("github", "not json")).toBeNull();
		expect(parsePushEvent("gitlab", {})).toBeNull();
	});
});
