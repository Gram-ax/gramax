import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

export abstract class LibGit2BaseCommands {
	constructor(protected _repoPath: string) {}

	protected _intoCreds(data: SourceData) {
		return {
			authorName: data.userName,
			authorEmail: data.userEmail,
			accessToken: "token" in data ? (data.token as string) : "",
			gitServerUsername: "gitServerUsername" in data ? (data.gitServerUsername as string) : "",
			protocol: "protocol" in data ? (data.protocol as string) : null,
		};
	}
}
