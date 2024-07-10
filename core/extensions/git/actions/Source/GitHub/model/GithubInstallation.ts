interface GithubInstallation {
	name: string;
	htmlUrl: string;
	avatarUrl: string;
	type: "Organization" | "User";
}

export default GithubInstallation;
