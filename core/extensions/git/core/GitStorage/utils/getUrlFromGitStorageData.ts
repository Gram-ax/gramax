import GitStorageData from "@ext/git/core/model/GitStorageData";

const getUrlFromGitStorageData = (data: GitStorageData): string => {
	return `https://${data.source.domain}/${data.group}/${data.name}`;
};

export default getUrlFromGitStorageData;
