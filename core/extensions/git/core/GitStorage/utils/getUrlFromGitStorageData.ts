import GitStorageData from "@ext/git/core/model/GitStorageData";

const getUrlFromGitStorageData = (data: GitStorageData, gitExtension = false): string => {
	return `${data.source.protocol ?? "https"}://${data.source.domain}/${data.group}/${data.name}${
		gitExtension ? ".git" : ""
	}`;
};

export default getUrlFromGitStorageData;
