export const getDiffCacheKey = (oldCommit: string, newCommit: string) => {
	if (oldCommit && newCommit) {
		return `${oldCommit}..${newCommit}`;
	}

	if (oldCommit) {
		return oldCommit;
	}

	if (newCommit) {
		return newCommit;
	}

	return "";
};
