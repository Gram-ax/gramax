import GitStorageData from "@ext/git/core/model/GitStorageData";

interface GithubStorageData extends GitStorageData {
	type: "Organization" | "User";
}

export default GithubStorageData;
