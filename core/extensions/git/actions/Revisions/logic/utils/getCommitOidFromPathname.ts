type CommitOid = string | [string, string];

const getCommitOidFromPathname = (pathname: string): CommitOid => {
	const difMatch = pathname?.match(/dif-([a-f0-9]{40})-([a-f0-9]{40})/);
	if (difMatch) return [difMatch[1], difMatch[2]];
	const commitMatch = pathname?.match(/commit-([a-f0-9]+)/);
	if (commitMatch) return commitMatch[1];
};

export const getNewCommitOidFromPathname = (pathname: string): string => {
	const result = getCommitOidFromPathname(pathname);
	return Array.isArray(result) ? result[1] : result;
};

export default getCommitOidFromPathname;
