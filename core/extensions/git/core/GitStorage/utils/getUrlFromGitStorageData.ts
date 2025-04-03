import GitStorageData from "@ext/git/core/model/GitStorageData";
import assert from "assert";

const getUrlFromGitStorageData = (data: GitStorageData, gitExtension = false): string => {
	assert(data, "expected GitStorageData to be not null");

	if (data.url) {
		if (data.url.startsWith("http")) return data.url;
		return `${data.source.protocol || "http"}://${data.url}`;
	}

	return `${data.source.protocol || "http"}://${data.source.domain}/${data.group}/${data.name}${
		gitExtension ? ".git" : ""
	}`;
};

export default getUrlFromGitStorageData;
