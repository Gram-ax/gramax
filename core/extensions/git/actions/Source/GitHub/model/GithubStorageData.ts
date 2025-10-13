import GitStorageData from "@ext/git/core/model/GitStorageData";

export const GithubUserType = {
	Organization: "Organization",
	User: "User",
} as const;

export type GithubUserType = (typeof GithubUserType)[keyof typeof GithubUserType];

interface GithubStorageData extends GitStorageData {
	type: GithubUserType;
}

export default GithubStorageData;
